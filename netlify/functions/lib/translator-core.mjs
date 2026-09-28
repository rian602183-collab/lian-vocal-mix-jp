import { timingSafeEqual } from 'node:crypto';

export const MAX_TEXT_CHARS = 4000;
const DEFAULT_FREE_URL = 'https://api-free.deepl.com/v2/translate';
const DEFAULT_PRO_URL = 'https://api.deepl.com/v2/translate';

const PROTECT_RE = /(https?:\/\/[^\s<>]+|@[A-Za-z0-9_]{1,30}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|(?:¥|￥|₩|\$|€)\s?[0-9][0-9,.]*|\b(?:MIX|LUFS|PayPal|BOOTH|CREPE|LIGHT|STANDARD|DELUXE|Cubase|inst|wav|mp3|m4a|48\s?kHz|44\.1\s?kHz|24\s?bit|16\s?bit|X|DM)\b|\b\d{1,2}:\d{2}(?::\d{2})?\b|\b\d{1,4}[\/-]\d{1,2}(?:[\/-]\d{1,4})?\b|\b\d+(?:\.\d+)?\s?(?:kHz|Hz|dB|LUFS|bit|ms|sec|秒|分|時間|日|週間|か月|名|人|track|tracks|トラック)\b)/giu;

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function decodeXml(value) {
  return String(value)
    .replace(/<\/?keep>/gi, '')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&');
}

export function protectForTranslation(text) {
  const source = String(text ?? '');
  let out = '';
  let last = 0;
  source.replace(PROTECT_RE, (match, ...args) => {
    const offset = args.at(-2);
    out += escapeXml(source.slice(last, offset));
    out += `<keep>${escapeXml(match)}</keep>`;
    last = offset + match.length;
    return match;
  });
  out += escapeXml(source.slice(last));
  return out;
}

export function restoreProtectedTranslation(text) {
  return decodeXml(text);
}

export function extractProtectedTokens(text) {
  return [...String(text ?? '').matchAll(PROTECT_RE)].map(match => match[0]);
}

function normalizeToken(token) {
  return String(token).replace(/\s+/g, '').toLowerCase();
}

export function integrityWarnings(source, translated) {
  const before = extractProtectedTokens(source).map(normalizeToken);
  const after = extractProtectedTokens(translated).map(normalizeToken);
  const remaining = [...after];
  const missing = [];
  for (const token of before) {
    const index = remaining.indexOf(token);
    if (index >= 0) remaining.splice(index, 1);
    else missing.push(token);
  }
  return missing.length ? [`보호 대상 숫자·금액·ID·MIX 용어 ${missing.length}개를 다시 확인하세요.`] : [];
}

export function safeEqualSecret(provided, expected) {
  if (!provided || !expected) return false;
  const a = Buffer.from(String(provided));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function resolveDeepLUrl(apiKey, overrideUrl = '') {
  if (overrideUrl) return overrideUrl;
  return String(apiKey || '').endsWith(':fx') ? DEFAULT_FREE_URL : DEFAULT_PRO_URL;
}

function directionConfig(direction) {
  if (direction === 'ja-ko') {
    return {
      source: 'JA',
      target: 'KO',
      context: 'A Japanese customer is asking a freelance vocal MIX engineer about a singing-cover project. Translate faithfully for the Korean-speaking engineer. Do not answer the customer.',
      instructions: [
        'Translate faithfully into natural Korean. Do not answer, summarize, infer, or add any promise.',
        'Keep names, URLs, IDs, prices, dates, times, track counts, plan names, MIX terms, and file formats unchanged when tagged.',
        'Preserve uncertainty: questions stay questions, estimates stay estimates, and tentative wording must not become confirmation.'
      ],
      formality: 'default'
    };
  }
  if (direction === 'ko-ja') {
    return {
      source: 'KO',
      target: 'JA',
      context: 'A Korean freelance vocal MIX engineer is replying to a Japanese singing-cover customer. The translation will be reviewed by the engineer before it is sent.',
      instructions: [
        'Translate into natural polite Japanese suitable for customer support. Do not add facts, discounts, deadlines, guarantees, or apologies not present in the source.',
        'Keep names, URLs, IDs, prices, dates, times, track counts, plan names, MIX terms, and file formats unchanged when tagged.',
        'Preserve uncertainty and scope exactly. Do not turn a possibility into a confirmed acceptance or fixed delivery promise.'
      ],
      formality: 'prefer_more'
    };
  }
  throw new Error('UNSUPPORTED_DIRECTION');
}

async function parseProviderResponse(response) {
  const raw = await response.text();
  let json = null;
  try { json = JSON.parse(raw); } catch { /* handled below */ }
  return { raw, json };
}

function providerError(status, json) {
  const message = json?.message || json?.code || '';
  const error = new Error(`DEEPL_${status}`);
  error.status = status;
  error.providerMessage = String(message).slice(0, 300);
  return error;
}

export async function deeplTranslate({ text, direction, apiKey, apiUrl, fetchImpl = fetch, advanced = true }) {
  const cfg = directionConfig(direction);
  const body = {
    text: [protectForTranslation(text)],
    source_lang: cfg.source,
    target_lang: cfg.target,
    preserve_formatting: true,
    split_sentences: '1',
    formality: cfg.formality,
    tag_handling: 'xml',
    ignore_tags: ['keep'],
    context: cfg.context,
    show_billed_characters: true,
  };
  if (advanced) {
    body.custom_instructions = cfg.instructions;
    body.model_type = 'prefer_quality_optimized';
    body.tag_handling_version = 'v2';
  }

  const response = await fetchImpl(resolveDeepLUrl(apiKey, apiUrl), {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/json',
      'X-DeepL-Reporting-Tag': 'lian-chat-translator',
    },
    body: JSON.stringify(body),
  });

  const { json } = await parseProviderResponse(response);
  if (!response.ok) {
    // Some DeepL subscriptions/models may not support the newest optional
    // customization fields. Retry once with the stable core parameters.
    if (advanced && response.status === 400) {
      return deeplTranslate({ text, direction, apiKey, apiUrl, fetchImpl, advanced: false });
    }
    throw providerError(response.status, json);
  }

  const item = json?.translations?.[0];
  if (!item?.text) throw new Error('DEEPL_INVALID_RESPONSE');
  const translated = restoreProtectedTranslation(item.text);
  return {
    text: translated,
    detectedSourceLanguage: item.detected_source_language || cfg.source,
    billedCharacters: Number(item.billed_characters || 0),
    warnings: integrityWarnings(text, translated),
  };
}

export async function translateWithVerification({ text, direction, verify = false, apiKey, apiUrl, fetchImpl = fetch }) {
  const first = await deeplTranslate({ text, direction, apiKey, apiUrl, fetchImpl });
  let backTranslation = '';
  let verifyBilledCharacters = 0;
  const warnings = [...first.warnings];

  if (verify && direction === 'ko-ja') {
    const back = await deeplTranslate({ text: first.text, direction: 'ja-ko', apiKey, apiUrl, fetchImpl });
    backTranslation = back.text;
    verifyBilledCharacters = back.billedCharacters;
    warnings.push(...back.warnings.map(value => `역번역: ${value}`));
  }

  return {
    translation: first.text,
    backTranslation,
    detectedSourceLanguage: first.detectedSourceLanguage,
    billedCharacters: first.billedCharacters + verifyBilledCharacters,
    warnings,
  };
}
