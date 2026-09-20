import { createHash, timingSafeEqual } from 'node:crypto';

export const ORDER_ID = /^[A-Z0-9]{1,36}$/;
export const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export const LEASE_MS = 60_000;
export const IDEMPOTENCY_MS = 6 * 60 * 60 * 1000;
const BODY_LIMIT = 8192;
const MESSAGES = {
  INVALID_REQUEST: '入力内容をご確認ください。',
  FORBIDDEN: 'ページを再読み込みして、もう一度お試しください。',
  UNAVAILABLE: '現在、決済を開始できません。時間をおいてもう一度お試しください。',
  PROCESSING: '決済を確認しています。少し待ってから、同じ注文の状況をご確認ください。',
  ORDER_NOT_APPROVED: 'PayPal画面でお支払い内容をご確認ください。',
  INSTRUMENT_DECLINED: '決済を完了できませんでした。PayPalで別のお支払い方法をご確認ください。',
  PAYMENT_UNCERTAIN: '決済結果を確認できませんでした。新しく支払わず、同じ注文の状況をご確認ください。',
  PAYMENT_PENDING: 'お支払いは確認待ちです。新しく支払わず、後ほど同じ注文の状況をご確認ください。',
  PAYMENT_REVIEW_REQUIRED: '決済の確認が必要です。新しく支払わず、注文番号を添えてお問い合わせください。',
  INVALID_ORDER: 'この注文を確認できませんでした。',
  PAYMENT_MISMATCH: '決済内容を確認できませんでした。新しく支払わず、お問い合わせください。',
  RETRY_EXPIRED: 'この決済の再試行期限を過ぎました。新しく支払う前にお問い合わせください。',
};

export class PaymentError extends Error {
  constructor(status, code, recoverable = false) {
    super(MESSAGES[code] || MESSAGES.UNAVAILABLE);
    this.status = status; this.code = code; this.recoverable = recoverable;
  }
}
export const fail = (status, code, recoverable = false) => { throw new PaymentError(status, code, recoverable); };
export const hash = value => createHash('sha256').update(value).digest('hex');
export function equal(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {status, headers:{
    'content-type':'application/json; charset=utf-8', 'cache-control':'no-store',
    'x-content-type-options':'nosniff', 'x-robots-tag':'noindex, nofollow, noarchive',
    'referrer-policy':'no-referrer', ...extra,
  }});
}
export async function readBody(req) {
  if ((req.headers.get('content-type') || '').split(';')[0].trim().toLowerCase() !== 'application/json') fail(415,'INVALID_REQUEST');
  if (Number(req.headers.get('content-length')) > BODY_LIMIT) fail(413,'INVALID_REQUEST');
  const chunks = []; let size = 0; const reader = req.body?.getReader();
  if (reader) {
    try {
      while (true) {
        const item = await reader.read(); if (item.done) break;
        size += item.value.length;
        if (size > BODY_LIMIT) { await reader.cancel(); fail(413,'INVALID_REQUEST'); }
        chunks.push(item.value);
      }
    } finally { reader.releaseLock(); }
  }
  let parsed;
  try { parsed = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { fail(400,'INVALID_REQUEST'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) fail(400,'INVALID_REQUEST');
  return parsed;
}

// These checks compare gross customer payment, never the post-fee net amount.
export function moneyMatches(money, amountJPY) {
  return money?.currency_code === 'JPY' && money.value === String(amountJPY);
}
export function verifyOrder(order, record, { pinMerchant = false } = {}) {
  if (!order || typeof order.id !== 'string' || !ORDER_ID.test(order.id) || order.id !== record.paypalOrderId || order.intent !== 'CAPTURE' || !Array.isArray(order.purchase_units) || order.purchase_units.length !== 1) fail(502,'PAYMENT_MISMATCH');
  const unit = order.purchase_units[0];
  if (unit.reference_id !== record.referenceId || unit.custom_id !== record.referenceId || !moneyMatches(unit.amount,record.amountJPY)) fail(502,'PAYMENT_MISMATCH');
  const merchant = unit.payee?.merchant_id;
  if (typeof merchant !== 'string' || !/^[A-Z0-9]{1,64}$/.test(merchant) || (!pinMerchant && merchant !== record.merchantId)) fail(502,'PAYMENT_MISMATCH');
  return merchant;
}
export function verifyCapture(order, record) {
  if (!order || order.id !== record.paypalOrderId || !Array.isArray(order.purchase_units) || order.purchase_units.length !== 1) fail(502,'PAYMENT_MISMATCH');
  if (order.intent !== undefined && order.intent !== 'CAPTURE') fail(502,'PAYMENT_MISMATCH');
  const unit = order.purchase_units[0];
  if (unit.reference_id !== record.referenceId || (unit.custom_id !== undefined && unit.custom_id !== record.referenceId)) fail(502,'PAYMENT_MISMATCH');
  if (unit.amount !== undefined && !moneyMatches(unit.amount,record.amountJPY)) fail(502,'PAYMENT_MISMATCH');
  if (unit.payee !== undefined && unit.payee?.merchant_id !== record.merchantId) fail(502,'PAYMENT_MISMATCH');
  const captures = unit.payments?.captures;
  if (!Array.isArray(captures) || captures.length !== 1) fail(502,'PAYMENT_MISMATCH');
  const capture = captures[0];
  if (typeof capture.id !== 'string' || !ORDER_ID.test(capture.id) || !moneyMatches(capture.amount,record.amountJPY) || capture.final_capture === false) fail(502,'PAYMENT_MISMATCH');
  if (capture.status === 'PENDING') fail(409,'PAYMENT_PENDING',true);
  if (order.status !== 'COMPLETED' || capture.status !== 'COMPLETED') fail(409,'PAYMENT_REVIEW_REQUIRED');
  return {id:capture.id,status:'COMPLETED',amountJPY:record.amountJPY,currency:'JPY'};
}

export function createPayPalClient({ env, fetchImpl, logger }) {
  const base = env.PAYPAL_ENV === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
  function log(status, response, ids) {
    const data = {status};
    const debug = response?.headers?.get('paypal-debug-id');
    if (debug && /^[A-Za-z0-9_-]{1,100}$/.test(debug)) data.debugId = debug;
    if (ORDER_ID.test(ids?.orderId || '')) data.orderId = ids.orderId;
    if (UUID.test(ids?.requestId || '')) data.requestId = ids.requestId;
    try { logger(data); } catch { /* Logging cannot alter a payment result. */ }
  }
  async function call(path, init, ids = {}, oauth = false) {
    let response;
    try {
      response = await fetchImpl(base + path, {...init, redirect:'error', signal:AbortSignal.timeout(8000)});
    } catch (error) {
      log(error?.name === 'TimeoutError' || error?.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',null,ids);
      fail(503,oauth ? 'UNAVAILABLE' : 'PAYMENT_UNCERTAIN',!oauth);
    }
    let payload;
    try { payload = await response.json(); } catch {
      log('MALFORMED_RESPONSE',response,ids); fail(502,oauth ? 'UNAVAILABLE' : 'PAYMENT_UNCERTAIN',!oauth);
    }
    if (!response.ok) {
      log(oauth ? (response.status === 401 ? 'INVALID_CREDENTIALS' : 'OAUTH_FAILURE') : response.status,response,ids);
      const issues = Array.isArray(payload?.details) ? payload.details.map(item => item?.issue) : [];
      if (!oauth && issues.includes('ORDER_ALREADY_CAPTURED')) fail(409,'ALREADY_CAPTURED',true);
      if (!oauth && issues.includes('ORDER_NOT_APPROVED')) fail(409,'ORDER_NOT_APPROVED');
      if (!oauth && issues.includes('INSTRUMENT_DECLINED')) fail(422,'INSTRUMENT_DECLINED');
      if (oauth) fail(503,'UNAVAILABLE');
      if (response.status >= 500 || response.status === 408 || response.status === 429) fail(503,'PAYMENT_UNCERTAIN',true);
      if (response.status === 404) fail(404,'INVALID_ORDER');
      // Unknown 4xx are not evidence that no payment was taken.
      fail(502,'PAYMENT_REVIEW_REQUIRED');
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      log('MALFORMED_RESPONSE',response,ids); fail(502,oauth ? 'UNAVAILABLE' : 'PAYMENT_UNCERTAIN',!oauth);
    }
    return payload;
  }
  return {
    async token() {
      const auth = Buffer.from(env.PAYPAL_CLIENT_ID + ':' + env.PAYPAL_CLIENT_SECRET).toString('base64');
      const payload = await call('/v1/oauth2/token', {method:'POST',headers:{authorization:'Basic ' + auth,'content-type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials'}, {},true);
      if (typeof payload.access_token !== 'string' || !payload.access_token || payload.access_token.length > 8192 || typeof payload.token_type !== 'string' || payload.token_type.toLowerCase() !== 'bearer') fail(502,'UNAVAILABLE');
      return payload.access_token;
    },
    request(path, token, {method = 'GET',body,requestId,orderId} = {}) {
      return call(path, {method,headers:{authorization:'Bearer ' + token,'content-type':'application/json','prefer':'return=representation',...(requestId ? {'paypal-request-id':requestId} : {})},...(body !== undefined ? {body:JSON.stringify(body)} : {})}, {orderId,requestId});
    },
  };
}
