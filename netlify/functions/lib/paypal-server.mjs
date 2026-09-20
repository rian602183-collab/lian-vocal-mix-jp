import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { calculateQuote, PricingError } from './paypal-pricing.mjs';
import { ORDER_ID, UUID, LEASE_MS, IDEMPOTENCY_MS, PaymentError, fail, hash, equal, json, readBody, verifyOrder, verifyCapture, createPayPalClient } from './paypal-protocol.mjs';

const COOKIE = 'lian_paypal_session';
const SESSION = /^[A-Za-z0-9_-]{43}$/;
const CANONICAL = 'https://lian-vocal-mix-jp.netlify.app';
const PREVIEW_HOST = /^(?:deploy-preview-\d+|[a-f0-9]{24})--lian-vocal-mix-jp\.netlify\.app$/;
const STATES = ['CREATING','CREATE_UNKNOWN','CREATED','CAPTURING','CAPTURE_UNKNOWN','PENDING','REVIEW_REQUIRED','COMPLETED'];

// Dependencies are injected for offline verification. Tokens stay in invocation
// memory; this store receives only normalized choices and minimal order metadata.
export function createPayPalHandlers({store,env = process.env,fetchImpl = fetch,now = () => Date.now(),uuid = randomUUID,nonce = () => randomBytes(32).toString('base64url'),logger = data => console.warn('paypal',data)}) {
  function configured() {
    if (!['sandbox','live'].includes(env.PAYPAL_ENV) || typeof env.PAYPAL_CLIENT_ID !== 'string' || !env.PAYPAL_CLIENT_ID || typeof env.PAYPAL_CLIENT_SECRET !== 'string' || !env.PAYPAL_CLIENT_SECRET) fail(503,'UNAVAILABLE');
  }
  function safeOrigin(value) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password || url.hostname === 'lian-vocal-mix.netlify.app' || url.hostname.endsWith('--lian-vocal-mix.netlify.app')) return null;
      return url.origin;
    } catch { return null; }
  }
  function requestContext(req) {
    configured();
    const url = new URL(req.url), allowed = new Set([CANONICAL]);
    if (env.PUBLIC_SITE_URL) {
      const publicOrigin = safeOrigin(env.PUBLIC_SITE_URL); if (!publicOrigin) fail(503,'UNAVAILABLE');
      allowed.add(publicOrigin);
    }
    const siteOrigin = safeOrigin(env.URL); if (siteOrigin) allowed.add(siteOrigin);
    for (const value of [env.DEPLOY_PRIME_URL,env.DEPLOY_URL]) {
      const candidate = safeOrigin(value);
      if (candidate && PREVIEW_HOST.test(new URL(candidate).hostname)) allowed.add(candidate);
    }
    const local = env.PAYPAL_ENV === 'sandbox' && ['localhost','127.0.0.1','[::1]'].includes(url.hostname) && ['http:','https:'].includes(url.protocol);
    if (!local && !allowed.has(url.origin)) fail(403,'FORBIDDEN');
    const origin = req.headers.get('origin'), fetchSite = req.headers.get('sec-fetch-site');
    if ((origin && origin !== url.origin) || (fetchSite && !['same-origin','none'].includes(fetchSite))) fail(403,'FORBIDDEN');
    const preview = PREVIEW_HOST.test(url.hostname) && allowed.has(url.origin);
    const enabled = env.PAYPAL_ENV === 'live' || local || preview || url.searchParams.get('paypal_test') === '1';
    return {url,enabled};
  }
  function sessionFrom(req) {
    const values = (req.headers.get('cookie') || '').split(';').map(item => item.trim()).filter(item => item.startsWith(COOKIE + '='));
    if (values.length !== 1) return null;
    const value = values[0].slice(COOKIE.length + 1); return SESSION.test(value) ? value : null;
  }
  function csrf(session) {
    return createHmac('sha256',env.PAYPAL_CLIENT_SECRET).update('lian-paypal-csrf-v1\n' + env.PAYPAL_ENV + '\n' + session).digest('base64url');
  }
  function postContext(req) {
    const context = requestContext(req);
    if (!context.enabled || req.headers.get('origin') !== context.url.origin) fail(403,'FORBIDDEN');
    const session = sessionFrom(req);
    if (!session || !equal(req.headers.get('x-lian-paypal-csrf'),csrf(session))) fail(403,'FORBIDDEN');
    return {...context,session};
  }
  const storage = () => typeof store === 'function' ? store() : store;
  async function read(key) {
    const entry = await storage().getWithMetadata(key,{type:'json',consistency:'strong'});
    if (!entry) return null;
    if (!entry.data || typeof entry.etag !== 'string' || !entry.etag) fail(503,'PAYMENT_UNCERTAIN',true);
    return entry;
  }
  async function write(key,record,conditions) {
    const result = await storage().setJSON(key,record,conditions);
    // Blobs v10 reports conditional conflicts without throwing.
    if (result?.modified !== true) fail(409,'PROCESSING',true);
    return record;
  }
  function keyFor(session,checkoutKey) {
    if (typeof checkoutKey !== 'string' || !UUID.test(checkoutKey)) fail(400,'INVALID_REQUEST');
    return 'checkout-' + hash(env.PAYPAL_ENV + '\n' + session + '\n' + checkoutKey.toLowerCase());
  }
  function checkRecord(record, session, checkoutKey) {
    if (record.schemaVersion !== 1 || record.environment !== env.PAYPAL_ENV || record.sessionHash !== hash(session) || record.checkoutKey !== checkoutKey.toLowerCase() || record.currency !== 'JPY' || !STATES.includes(record.status) || !UUID.test(record.referenceId || '') || !UUID.test(record.createRequestId || '') || !UUID.test(record.captureRequestId || '') || !Number.isFinite(record.createdAt)) fail(409,'INVALID_ORDER');
    let quote;
    try { quote = calculateQuote(record.normalizedQuote); } catch { fail(409,'INVALID_ORDER'); }
    if (quote.amountJPY !== record.amountJPY || hash(JSON.stringify(quote.normalizedQuote)) !== record.quoteFingerprint) fail(409,'INVALID_ORDER');
    if (record.paypalOrderId !== null && (typeof record.paypalOrderId !== 'string' || !ORDER_ID.test(record.paypalOrderId))) fail(409,'INVALID_ORDER');
    if (!['CREATING','CREATE_UNKNOWN'].includes(record.status) && (!record.paypalOrderId || typeof record.merchantId !== 'string' || !/^[A-Z0-9]{1,64}$/.test(record.merchantId))) fail(409,'INVALID_ORDER');
    return record;
  }
  function completed(record) {
    if (record.status !== 'COMPLETED' || record.capture?.status !== 'COMPLETED' || !ORDER_ID.test(record.capture?.id || '') || record.capture?.amountJPY !== record.amountJPY || record.capture?.currency !== 'JPY' || !ORDER_ID.test(record.paypalOrderId || '') || !record.merchantId) fail(409,'INVALID_ORDER');
    return json({status:'COMPLETED',id:record.paypalOrderId,amountJPY:record.amountJPY,currency:'JPY'});
  }
  async function claim(key,entry,status) {
    if (entry.data.leaseUntil > now()) fail(409,'PROCESSING',true);
    const leaseId = uuid();
    const record = {...entry.data,status,leaseId,leaseUntil:now() + LEASE_MS,updatedAt:now()};
    await write(key,record,{onlyIfMatch:entry.etag});
    const fresh = await read(key);
    if (!fresh || fresh.data.leaseId !== leaseId) fail(409,'PROCESSING',true);
    return fresh;
  }
  async function settle(key,entry,patch) {
    return write(key,{...entry.data,...patch,leaseId:null,leaseUntil:0,updatedAt:now()},{onlyIfMatch:entry.etag});
  }
  function client() { return createPayPalClient({env,fetchImpl,logger}); }
  function orderBody(record) {
    const money = {currency_code:'JPY',value:String(record.amountJPY)};
    const q = record.normalizedQuote;
    return {
      intent:'CAPTURE',
      payment_source:{paypal:{experience_context:{brand_name:'Lian Vocal MIX',locale:'ja-JP',shipping_preference:'NO_SHIPPING',user_action:'PAY_NOW'}}},
      purchase_units:[{
        reference_id:record.referenceId,custom_id:record.referenceId,
        description:`Lian Vocal MIX / ${q.plan.toUpperCase()} / ${q.partyType} ${q.participantCount} / tracks ${q.extraVocalTracks} / ${q.options.join('+') || 'none'} / ${q.rush}`,
        amount:{...money,breakdown:{item_total:money}},
        items:[{name:'Lian Vocal MIX',quantity:'1',category:'DIGITAL_GOODS',unit_amount:money}],
      }],
    };
  }
  async function guard(req,method,operation) {
    if (req.method !== method) return json({error:{code:'METHOD_NOT_ALLOWED',message:'この操作は利用できません。',recoverable:false}},405,{allow:method});
    try { return await operation(); }
    catch (error) {
      if (error instanceof PaymentError || error instanceof PricingError) return json({error:{code:error.code,message:error.message,recoverable:error.recoverable === true}},error.status);
      // Never print arbitrary exceptions, request bodies or upstream responses.
      try { logger({status:'STORAGE_OR_INTERNAL_ERROR'}); } catch { /* no-op */ }
      return json({error:{code:'PAYMENT_UNCERTAIN',message:'決済結果を確認できませんでした。新しく支払わず、同じ注文の状況をご確認ください。',recoverable:true}},503);
    }
  }
  return {
    config(req) { return guard(req,'GET',async () => {
      const {url,enabled} = requestContext(req);
      if (!enabled) return json({enabled:false,environment:env.PAYPAL_ENV,currency:'JPY'});
      const session = sessionFrom(req) || nonce();
      if (!SESSION.test(session)) fail(503,'UNAVAILABLE');
      return json({enabled:true,clientId:env.PAYPAL_CLIENT_ID,environment:env.PAYPAL_ENV,currency:'JPY',csrfToken:csrf(session)},200,{
        'set-cookie':`${COOKIE}=${session}; Path=/.netlify/functions; HttpOnly; SameSite=Lax; Max-Age=21600${url.protocol === 'https:' ? '; Secure' : ''}`,
      });
    }); },
    createOrder(req) { return guard(req,'POST',async () => {
      const {session} = postContext(req), body = await readBody(req);
      const key = keyFor(session,body.checkoutKey), calculated = calculateQuote(body.quote);
      const fingerprint = hash(JSON.stringify(calculated.normalizedQuote));
      let entry = await read(key);
      if (!entry) {
        const record = {
          schemaVersion:1,environment:env.PAYPAL_ENV,createdAt:now(),updatedAt:now(),
          checkoutKey:body.checkoutKey.toLowerCase(),sessionHash:hash(session),
          paypalOrderId:null,merchantId:null,status:'CREATING',currency:'JPY',
          normalizedQuote:calculated.normalizedQuote,amountJPY:calculated.amountJPY,quoteFingerprint:fingerprint,
          referenceId:uuid(),createRequestId:uuid(),captureRequestId:uuid(),
          leaseId:uuid(),leaseUntil:now() + LEASE_MS,
        };
        await write(key,record,{onlyIfNew:true});
        entry = await read(key);
        if (!entry || entry.data.leaseId !== record.leaseId) fail(409,'PROCESSING',true);
      } else {
        checkRecord(entry.data,session,body.checkoutKey);
        if (entry.data.quoteFingerprint !== fingerprint) fail(409,'INVALID_ORDER');
        if (entry.data.status === 'CREATED') return json({id:entry.data.paypalOrderId,amountJPY:entry.data.amountJPY,currency:'JPY'});
        if (!['CREATING','CREATE_UNKNOWN'].includes(entry.data.status)) fail(409,'PAYMENT_UNCERTAIN',true);
        if (now() - entry.data.createdAt >= IDEMPOTENCY_MS) fail(409,'RETRY_EXPIRED');
        entry = await claim(key,entry,'CREATING');
      }
      const api = client(); let knownId = entry.data.paypalOrderId;
      try {
        const token = await api.token();
        let order = knownId ? await api.request('/v2/checkout/orders/' + knownId,token,{orderId:knownId}) : await api.request('/v2/checkout/orders',token,{method:'POST',body:orderBody(entry.data),requestId:entry.data.createRequestId});
        if (typeof order.id !== 'string' || !ORDER_ID.test(order.id)) fail(502,'PAYMENT_UNCERTAIN',true);
        if (knownId && order.id !== knownId) fail(502,'PAYMENT_MISMATCH');
        knownId = order.id;
        const expected = {...entry.data,paypalOrderId:knownId};
        // A minimal create response is legal. Request a full server-side resource.
        if (!order.intent || !order.purchase_units?.[0]?.amount || !order.purchase_units?.[0]?.payee?.merchant_id || !order.purchase_units?.[0]?.custom_id) order = await api.request('/v2/checkout/orders/' + knownId,token,{orderId:knownId});
        const merchantId = verifyOrder(order,expected,{pinMerchant:true});
        if (!['CREATED','PAYER_ACTION_REQUIRED','APPROVED'].includes(order.status)) fail(409,'PAYMENT_REVIEW_REQUIRED');
        await settle(key,entry,{paypalOrderId:knownId,merchantId,status:'CREATED'});
        return json({id:knownId,amountJPY:entry.data.amountJPY,currency:'JPY'});
      } catch (error) {
        // Reuse this record/request ID after uncertain creation, never a new ID.
        await settle(key,entry,{status:'CREATE_UNKNOWN',paypalOrderId:knownId});
        throw error;
      }
    }); },
    captureOrder(req) { return guard(req,'POST',async () => {
      const {session} = postContext(req), body = await readBody(req);
      if (typeof body.orderId !== 'string' || !ORDER_ID.test(body.orderId)) fail(400,'INVALID_REQUEST');
      const key = keyFor(session,body.checkoutKey);
      let entry = await read(key);
      if (!entry) fail(404,'INVALID_ORDER');
      const record = checkRecord(entry.data,session,body.checkoutKey);
      if (record.paypalOrderId !== body.orderId || !record.merchantId) fail(409,'INVALID_ORDER');
      if (record.status === 'COMPLETED') return completed(record);
      if (!['CREATED','CAPTURING','CAPTURE_UNKNOWN','PENDING','REVIEW_REQUIRED'].includes(record.status)) fail(409,'INVALID_ORDER');
      const previousStatus = record.status;
      entry = await claim(key,entry,'CAPTURING');
      const api = client(); let captureSent = false;
      try {
        const token = await api.token();
        const path = '/v2/checkout/orders/' + record.paypalOrderId;
        let order = await api.request(path,token,{orderId:record.paypalOrderId});
        verifyOrder(order,record);
        // Reconcile capture success/uncertainty before considering another POST.
        const payments = order.purchase_units[0].payments;
        if (payments !== undefined && (!payments || typeof payments !== 'object' || Array.isArray(payments) || (payments.captures !== undefined && !Array.isArray(payments.captures)))) fail(502,'PAYMENT_MISMATCH');
        const hasCapture = Array.isArray(payments?.captures) && payments.captures.length > 0;
        if (order.status !== 'COMPLETED' && !hasCapture) {
          if (['PENDING','REVIEW_REQUIRED'].includes(previousStatus)) fail(409,'PAYMENT_REVIEW_REQUIRED');
          if (order.status !== 'APPROVED') fail(409,'ORDER_NOT_APPROVED');
          if (record.captureRequestedAt !== undefined && now() - record.captureRequestedAt >= IDEMPOTENCY_MS) fail(409,'RETRY_EXPIRED');
          // Persist the first outbound capture time before the remote effect.
          if (record.captureRequestedAt === undefined) {
            const leaseId = entry.data.leaseId;
            await write(key,{...entry.data,captureRequestedAt:now()},{onlyIfMatch:entry.etag});
            const fresh = await read(key);
            if (!fresh || fresh.data.leaseId !== leaseId || fresh.data.status !== 'CAPTURING') fail(409,'PROCESSING',true);
            entry = fresh;
          }
          captureSent = true;
          try { order = await api.request(path + '/capture',token,{method:'POST',body:{},requestId:record.captureRequestId,orderId:record.paypalOrderId}); }
          catch (error) {
            if (error instanceof PaymentError && error.code === 'ALREADY_CAPTURED') {
              order = await api.request(path,token,{orderId:record.paypalOrderId}); verifyOrder(order,record);
            } else throw error;
          }
        }
        const capture = verifyCapture(order,record);
        const final = await settle(key,entry,{status:'COMPLETED',capture,completedAt:now()});
        return completed(final);
      } catch (error) {
        let status = 'CAPTURE_UNKNOWN';
        if (error.code === 'PAYMENT_PENDING') status = 'PENDING';
        else if (['PAYMENT_MISMATCH','PAYMENT_REVIEW_REQUIRED','RETRY_EXPIRED'].includes(error.code)) status = 'REVIEW_REQUIRED';
        else if (['ORDER_NOT_APPROVED','INSTRUMENT_DECLINED'].includes(error.code) || (!captureSent && error.code === 'UNAVAILABLE' && previousStatus === 'CREATED')) status = 'CREATED';
        await settle(key,entry,{status});
        throw error;
      }
    }); },
  };
}
