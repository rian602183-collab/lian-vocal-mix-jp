import assert from 'node:assert/strict';
import handler from '../netlify/functions/operator-translate.mjs';
import {
  MAX_TEXT_CHARS,
  protectForTranslation,
  restoreProtectedTranslation,
  extractProtectedTokens,
  integrityWarnings,
  resolveDeepLUrl,
  safeEqualSecret,
  translateWithVerification,
} from '../netlify/functions/lib/translator-core.mjs';

let passed = 0;
function ok(name, fn) {
  try { fn(); passed++; console.log(`PASS ${name}`); }
  catch (e) { console.error(`FAIL ${name}`); throw e; }
}
async function okAsync(name, fn) {
  try { await fn(); passed++; console.log(`PASS ${name}`); }
  catch (e) { console.error(`FAIL ${name}`); throw e; }
}

ok('constant-time helper accepts exact secret', () => assert.equal(safeEqualSecret('abc123','abc123'), true));
ok('constant-time helper rejects wrong secret', () => assert.equal(safeEqualSecret('abc123','abc124'), false));
ok('DeepL Free endpoint auto-detected', () => assert.equal(resolveDeepLUrl('sample:fx'), 'https://api-free.deepl.com/v2/translate'));
ok('DeepL Pro endpoint default', () => assert.equal(resolveDeepLUrl('sample'), 'https://api.deepl.com/v2/translate'));
ok('DeepL override endpoint wins', () => assert.equal(resolveDeepLUrl('sample:fx','https://example.test/v2/translate'), 'https://example.test/v2/translate'));

const source = 'STANDARD ¥5,500 / PayPal / @Lian5602 / https://example.com/a?b=1 / 48kHz 24bit MIX';
const protectedXml = protectForTranslation(source);
ok('protected tokens wrapped', () => {
  assert.match(protectedXml, /<keep>STANDARD<\/keep>/);
  assert.match(protectedXml, /<keep>¥5,500<\/keep>/);
  assert.match(protectedXml, /<keep>@Lian5602<\/keep>/);
  assert.match(protectedXml, /<keep>https:\/\/example\.com\/a\?b=1<\/keep>/);
});
ok('protected XML round-trips', () => assert.equal(restoreProtectedTranslation(protectedXml), source));
ok('protected token extraction sees invariants', () => assert.ok(extractProtectedTokens(source).length >= 7));
ok('integrity warning empty when invariants survive', () => assert.deepEqual(integrityWarnings(source, source), []));
ok('integrity warning fires when price disappears', () => assert.equal(integrityWarnings(source, source.replace('¥5,500','')).length, 1));

function mockTranslation(text, target) {
  // Keep <keep>...</keep> spans unchanged and transform only a few test phrases.
  if (target === 'KO') {
    return text
      .replace('明日の夜までにお願いできますか？', '내일 밤까지 부탁드릴 수 있을까요?')
      .replace('料金は', '요금은')
      .replace('です。', '입니다.');
  }
  return text
    .replace('먼저 음원과 트랙 수를 확인한 뒤 정확한 납기를 안내드리겠습니다.', 'まず音源とトラック数を確認した後、正確な納期をご案内いたします。')
    .replace('가격은', '料金は')
    .replace('입니다.', 'です。');
}

const mockFetch = async (_url, options) => {
  const body = JSON.parse(options.body);
  const translated = mockTranslation(body.text[0], body.target_lang);
  return new Response(JSON.stringify({ translations: [{ detected_source_language: body.source_lang, text: translated, billed_characters: body.text[0].length }] }), { status: 200, headers: { 'content-type': 'application/json' } });
};

await okAsync('JA->KO translation preserves protected terms', async () => {
  const result = await translateWithVerification({
    text: '料金は STANDARD ¥5,500 です。', direction: 'ja-ko', apiKey: 'mock', fetchImpl: mockFetch,
  });
  assert.match(result.translation, /STANDARD/);
  assert.match(result.translation, /¥5,500/);
  assert.deepEqual(result.warnings, []);
});

await okAsync('KO->JA reverse verification returns back translation', async () => {
  const result = await translateWithVerification({
    text: '먼저 음원과 트랙 수를 확인한 뒤 정확한 납기를 안내드리겠습니다.', direction: 'ko-ja', verify: true, apiKey: 'mock', fetchImpl: mockFetch,
  });
  assert.match(result.translation, /まず音源/);
  assert.ok(result.backTranslation.length > 0);
});

let retryCalls = 0;
const retryFetch = async (_url, options) => {
  retryCalls++;
  const body = JSON.parse(options.body);
  if (body.custom_instructions) return new Response(JSON.stringify({ message: 'unsupported optional parameter' }), { status: 400, headers: { 'content-type': 'application/json' } });
  return new Response(JSON.stringify({ translations: [{ detected_source_language: body.source_lang, text: body.text[0], billed_characters: 1 }] }), { status: 200, headers: { 'content-type': 'application/json' } });
};
await okAsync('400 on advanced DeepL options retries with stable core request', async () => {
  const result = await translateWithVerification({ text: 'MIX 테스트', direction: 'ko-ja', apiKey: 'mock', fetchImpl: retryFetch });
  assert.equal(retryCalls, 2);
  assert.match(result.translation, /MIX/);
});

process.env.LIAN_TRANSLATOR_ACCESS_KEY = 'unit-secret';
process.env.DEEPL_API_KEY = 'mock:fx';
process.env.DEEPL_API_URL = 'https://mock.invalid/translate';

async function call(method, body, key = 'unit-secret', extraHeaders = {}) {
  const headers = { 'x-lian-translator-key': key, ...extraHeaders };
  if (body !== undefined) headers['content-type'] = 'application/json';
  const req = new Request('https://lian.example/.netlify/functions/operator-translate', { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return handler(req);
}

await okAsync('GET health rejects wrong access key', async () => {
  const res = await call('GET', undefined, 'wrong'); assert.equal(res.status, 401);
});
await okAsync('GET health reports DeepL configured', async () => {
  const res = await call('GET'); const json = await res.json(); assert.equal(res.status, 200); assert.equal(json.configured, true); assert.equal(json.maxTextChars, MAX_TEXT_CHARS);
});
await okAsync('cross-origin browser request blocked', async () => {
  const res = await call('GET', undefined, 'unit-secret', { origin: 'https://evil.example' }); assert.equal(res.status, 403);
});
await okAsync('invalid direction rejected before provider call', async () => {
  const res = await call('POST', { text: 'hello', direction: 'en-ja' }); assert.equal(res.status, 400);
});
await okAsync('reverse verify rejected for JA->KO', async () => {
  const res = await call('POST', { text: 'こんにちは', direction: 'ja-ko', verify: true }); assert.equal(res.status, 400);
});
await okAsync('empty text rejected', async () => {
  const res = await call('POST', { text: ' ', direction: 'ja-ko' }); assert.equal(res.status, 400);
});
await okAsync('oversized text rejected', async () => {
  const res = await call('POST', { text: 'a'.repeat(MAX_TEXT_CHARS + 1), direction: 'ja-ko' }); assert.equal(res.status, 413);
});
await okAsync('unsupported method rejected', async () => {
  const res = await call('DELETE'); assert.equal(res.status, 405);
});

console.log(`\n${passed} translator checks passed.`);
