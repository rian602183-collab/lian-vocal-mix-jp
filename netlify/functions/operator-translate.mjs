import {
  MAX_TEXT_CHARS,
  safeEqualSecret,
  translateWithVerification,
} from './lib/translator-core.mjs';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store, max-age=0',
  pragma: 'no-cache',
  'x-content-type-options': 'nosniff',
  'x-robots-tag': 'noindex, nofollow, noarchive',
  'referrer-policy': 'no-referrer',
};

const buckets = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 24;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers });
}

function clientId(request) {
  const forwarded = request.headers.get('x-nf-client-connection-ip') || request.headers.get('x-forwarded-for') || 'unknown';
  return forwarded.split(',')[0].trim().slice(0, 80);
}

function checkRate(request) {
  const now = Date.now();
  const id = clientId(request);
  const existing = buckets.get(id);
  if (!existing || now - existing.started >= RATE_WINDOW_MS) {
    buckets.set(id, { started: now, count: 1 });
    return true;
  }
  existing.count += 1;
  if (existing.count > RATE_MAX) return false;
  if (buckets.size > 500) {
    for (const [key, value] of buckets) if (now - value.started > RATE_WINDOW_MS * 2) buckets.delete(key);
  }
  return true;
}

function authorized(request) {
  const expected = process.env.LIAN_TRANSLATOR_ACCESS_KEY || '';
  const provided = request.headers.get('x-lian-translator-key') || '';
  return Boolean(expected) && safeEqualSecret(provided, expected);
}

function sameOriginOrNonBrowser(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

function providerMessage(error) {
  if (error?.status === 456) return 'DeepL 사용 한도에 도달했습니다. DeepL 계정의 사용량/Cost Control을 확인하세요.';
  if (error?.status === 429) return 'DeepL 요청이 너무 많습니다. 잠시 후 다시 시도하세요.';
  if (error?.status === 403) return 'DeepL API 키 인증에 실패했습니다. DEEPL_API_KEY를 확인하세요.';
  if (error?.status === 413) return 'DeepL 요청 크기 제한을 초과했습니다.';
  return '번역 서비스 요청에 실패했습니다. 잠시 후 다시 시도하세요.';
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!['GET', 'POST'].includes(request.method)) return json({ error: 'METHOD_NOT_ALLOWED' }, 405);
  if (!sameOriginOrNonBrowser(request)) return json({ error: 'ORIGIN_NOT_ALLOWED' }, 403);

  if (!process.env.LIAN_TRANSLATOR_ACCESS_KEY) {
    return json({ error: 'SETUP_REQUIRED', field: 'LIAN_TRANSLATOR_ACCESS_KEY' }, 503);
  }
  if (!authorized(request)) return json({ error: 'UNAUTHORIZED' }, 401);

  if (request.method === 'GET') {
    return json({
      ok: true,
      configured: Boolean(process.env.DEEPL_API_KEY),
      provider: 'DeepL',
      maxTextChars: MAX_TEXT_CHARS,
    });
  }

  if (!checkRate(request)) return json({ error: 'RATE_LIMITED' }, 429);
  if (!process.env.DEEPL_API_KEY) return json({ error: 'SETUP_REQUIRED', field: 'DEEPL_API_KEY' }, 503);

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 20_000) return json({ error: 'PAYLOAD_TOO_LARGE' }, 413);

  let raw = '';
  try { raw = await request.text(); } catch { return json({ error: 'INVALID_BODY' }, 400); }
  if (raw.length > 20_000) return json({ error: 'PAYLOAD_TOO_LARGE' }, 413);

  let payload;
  try { payload = JSON.parse(raw || '{}'); } catch { return json({ error: 'INVALID_JSON' }, 400); }

  const text = String(payload?.text ?? '').trim();
  const direction = payload?.direction;
  const verify = Boolean(payload?.verify);
  if (!text) return json({ error: 'TEXT_REQUIRED' }, 400);
  if (text.length > MAX_TEXT_CHARS) return json({ error: 'TEXT_TOO_LONG', maxTextChars: MAX_TEXT_CHARS }, 413);
  if (!['ja-ko', 'ko-ja'].includes(direction)) return json({ error: 'INVALID_DIRECTION' }, 400);
  if (verify && direction !== 'ko-ja') return json({ error: 'VERIFY_ONLY_FOR_KO_JA' }, 400);

  try {
    const result = await translateWithVerification({
      text,
      direction,
      verify,
      apiKey: process.env.DEEPL_API_KEY,
      apiUrl: process.env.DEEPL_API_URL || '',
    });
    return json({ ok: true, ...result });
  } catch (error) {
    return json({ error: 'TRANSLATION_FAILED', message: providerMessage(error) }, 502);
  }
}
