import { createHmac, timingSafeEqual, randomBytes, randomUUID } from 'node:crypto';
import { secretsMatch, readCookie } from '../kakao-security.mjs';

const INVITE_SECONDS = 14 * 24 * 60 * 60;
const MODERATION_SECONDS = 60 * 60;
const BODY_LIMIT = 16_384;
const COOKIE = 'lian_review_confirm';
const MODERATE_PATH = '/.netlify/functions/reviews-moderate';
const ADMIN_PATH = '/.netlify/functions/reviews-admin';
const ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const NONCE = /^[A-Za-z0-9_-]{24,100}$/;
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const orderCountValue = value => Number.isInteger(value) && value >= 1 && value <= 5 ? value : 1;
const orderCountLabel = value => orderCountValue(value) === 5 ? '5회 이상' : orderCountValue(value) + '회차';
class ReviewError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (status, message) => { throw new ReviewError(status, message); };
function equal(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
function headers(type = 'application/json; charset=utf-8') {
  return {'content-type':type,'cache-control':'no-store','x-robots-tag':'noindex, nofollow, noarchive','referrer-policy':'no-referrer','x-content-type-options':'nosniff','x-frame-options':'DENY'};
}
function json(data, status = 200) { return new Response(JSON.stringify(data), {status, headers:headers()}); }
function html(title, content, status = 200, extra = {}) {
  // Native form POSTs under no-referrer can send Origin: null. Strict-origin
  // preserves origin validation while never disclosing token paths or queries.
  return new Response(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>${escape(title)} | Lian</title><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/jp.css"><link rel="stylesheet" href="/jp-brand-v71.css"><link rel="stylesheet" href="/review/review.css"></head><body class="jp-site"><main class="lian-review-shell"><a class="lian-review-brand" href="/">Lian <span>VOCAL MIX</span></a><section class="lian-review-card"><h1>${escape(title)}</h1>${content}</section></main></body></html>`, {status,headers:{...headers('text/html; charset=utf-8'),'referrer-policy':'strict-origin','content-security-policy':"default-src 'none'; style-src 'self'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",...extra}});
}
async function body(req) {
  const contentType = (req.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!['application/json','application/x-www-form-urlencoded'].includes(contentType)) fail(415,'지원하지 않는 요청 형식입니다.');
  if (Number(req.headers.get('content-length')) > BODY_LIMIT) fail(413,'입력 내용이 너무 큽니다.');
  const reader = req.body?.getReader();
  let size = 0; const chunks = [];
  if (reader) {
    try { while (true) { const item = await reader.read(); if (item.done) break; size += item.value.length; if (size > BODY_LIMIT) { await reader.cancel(); fail(413,'입력 내용이 너무 큽니다.'); } chunks.push(item.value); } }
    finally { reader.releaseLock(); }
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (contentType === 'application/json') {
    let parsed; try { parsed = JSON.parse(raw); } catch { fail(400,'입력 내용을 확인해 주세요.'); }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) fail(400,'입력 내용을 확인해 주세요.');
    return parsed;
  }
  const params = new URLSearchParams(raw);
  if ([...params.keys()].some(key => params.getAll(key).length !== 1)) fail(400,'중복된 입력 항목입니다.');
  return Object.fromEntries(params);
}

// Store and notification dependencies are injected for offline tests. Production
// uses the real Blobs Store and existing Kakao refresh-token infrastructure.
export function createReviewHandlers({ store, notifyReview, env = process.env, now = () => Date.now(), uuid = randomUUID, nonce = () => randomBytes(32).toString('base64url') }) {
  function origin() {
    let url;
    try { url = new URL(env.PUBLIC_SITE_URL || 'https://lian-vocal-mix-jp.netlify.app/'); } catch { fail(503,'사이트 설정을 확인해 주세요.'); }
    if (url.protocol !== 'https:' || url.username || url.password) fail(503,'사이트 설정을 확인해 주세요.');
    return url.origin;
  }
  function configured() {
    if (typeof env.REVIEW_HMAC_SECRET !== 'string' || env.REVIEW_HMAC_SECRET.length < 32 || typeof env.KAKAO_ADMIN_SECRET !== 'string' || env.KAKAO_ADMIN_SECRET.length < 32 || !/^\d+$/.test(String(env.KAKAO_ALLOWED_USER_ID || ''))) fail(503,'리뷰 관리자 설정이 완료되지 않았습니다.');
  }
  function postOrigin(req) {
    if (req.headers.get('origin') !== origin()) fail(403,'허용되지 않은 요청입니다.');
    const fetchSite = req.headers.get('sec-fetch-site');
    if (fetchSite && !['same-origin','none'].includes(fetchSite)) fail(403,'허용되지 않은 요청입니다.');
  }
  const seconds = () => Math.floor(now() / 1000);
  function signature(purpose, token) {
    configured();
    return createHmac('sha256', env.REVIEW_HMAC_SECRET).update(['lian-review-v72',purpose,token.id,token.action || '',String(token.expires),token.nonce].join('\n')).digest('base64url');
  }
  function tokenFor(record, action) {
    const details = action ? record.moderation : record.invite;
    const token = {id:record.id,...(action ? {action} : {}),expires:details.expires,nonce:details.nonce};
    return {...token,signature:signature(action ? 'moderation' : 'invitation',token)};
  }
  function validateToken(raw, purpose) {
    configured();
    if (!raw || typeof raw !== 'object' || !ID.test(String(raw.id || '')) || !NONCE.test(String(raw.nonce || '')) || !/^[A-Za-z0-9_-]{43}$/.test(String(raw.signature || ''))) fail(403,'無効なリンクです。Lianに新しいリンクをご依頼ください。');
    const expires = Number(raw.expires);
    if (!Number.isSafeInteger(expires) || !/^\d{10}$/.test(String(raw.expires))) fail(403,'無効なリンクです。');
    const token = {id:String(raw.id),expires,nonce:String(raw.nonce),signature:String(raw.signature)};
    if (purpose === 'moderation') {
      if (!['approve','reject'].includes(raw.action)) fail(403,'無効な操作です。');
      token.action = raw.action;
    } else if (raw.action !== undefined) fail(403,'無効なリンクです。');
    if (!equal(token.signature,signature(purpose,token))) fail(403,'リンクを確認できませんでした。');
    const ttl = purpose === 'moderation' ? MODERATION_SECONDS : INVITE_SECONDS;
    if (expires <= seconds()) fail(410,'リンクの有効期限が切れています。Lianに新しいリンクをご依頼ください。');
    if (expires > seconds() + ttl + 60) fail(403,'無効な有効期限です。');
    return token;
  }
  async function read(id) {
    const entry = await store.getWithMetadata('review-' + id, {type:'json',consistency:'strong'});
    if (!entry || !entry.data || entry.data.id !== id) fail(404,'レビューが見つかりません。');
    if (typeof entry.etag !== 'string' || !entry.etag) fail(503,'保存状態を確認できません。時間をおいて再度お試しください。');
    return entry;
  }
  async function write(record, conditions) {
    const result = await store.set('review-' + record.id, JSON.stringify(record), conditions);
    if (result?.modified !== true) fail(409,'このリンクは使用済み、または別の操作で更新されています。');
    // In addition to a conflict, reject ambiguous SDK success without a real ETag.
    if (typeof result.etag !== 'string' || !result.etag) fail(503,'保存結果を確認できません。Lianへお問い合わせください。');
  }
  function matches(token, details) { return details && token.expires === details.expires && equal(token.nonce,details.nonce); }
  function links(record) {
    return Object.fromEntries(['approve','reject'].map(action => {
      const url = new URL(MODERATE_PATH,origin());
      for (const [key,value] of Object.entries(tokenFor(record,action))) url.searchParams.set(key,String(value));
      return [action,url.href];
    }));
  }
  async function send(record) {
    try { if (typeof notifyReview !== 'function') throw new Error('Unavailable'); await notifyReview(record,links(record)); return true; }
    catch { console.error('Review saved; Kakao notification unavailable.'); return false; }
  }
  async function allRecords() {
    const result = [];
    // Small, invitation-only store: enumerate pages and re-read canonical records.
    // Never publish a projection before the canonical approved CAS succeeds.
    const pages = store.list({prefix:'review-',paginate:true});
    for await (const page of pages) {
      const blobs = Array.isArray(page.blobs) ? page.blobs : [];
      for (let i = 0; i < blobs.length; i += 10) {
        const entries = await Promise.all(blobs.slice(i,i+10).map(async blob => {
          if (typeof blob.key !== 'string' || !ID.test(blob.key.slice(7))) return null;
          const entry = await store.getWithMetadata(blob.key,{type:'json',consistency:'strong'});
          return entry?.data || null;
        }));
        result.push(...entries.filter(Boolean));
      }
    }
    return result;
  }
  function adminForm(operation = 'invite', reviewId = '') {
    const operations = operation === 'renew'
      ? '<button type="submit" name="operation" value="renew">승인 링크 재발급 · 카카오 재알림</button>'
      : '<button type="submit" name="operation" value="invite">고객용 리뷰 초대 링크 만들기</button><button class="secondary" type="submit" name="operation" value="queue">대기 리뷰 확인</button>';
    const countSelect = operation === 'invite' ? '<label for="order-count">이번 의뢰 회차</label><select id="order-count" name="orderCount"><option value="1" selected>1회차</option><option value="2">2회차</option><option value="3">3회차</option><option value="4">4회차</option><option value="5">5회 이상</option></select>' : '';
    return `<form method="POST" action="${ADMIN_PATH}" autocomplete="off"><label for="admin-secret">관리자 비밀값</label><input id="admin-secret" name="admin_secret" type="password" required minlength="32" maxlength="512" autocomplete="off" spellcheck="false">${reviewId ? `<input type="hidden" name="review_id" value="${escape(reviewId)}">` : ''}${countSelect}${operations}</form>`;
  }
  function content(record) {
    return `<dl><dt>실제 활동명</dt><dd>${escape(record.displayName)}</dd><dt>사이트 익명 표시</dt><dd>${record.anonymousDisplay === true ? '사용' : '사용하지 않음'}</dd><dt>의뢰 회차</dt><dd>${orderCountLabel(record.orderCount)}</dd><dt>곡명</dt><dd>${escape(record.songTitle || '—')}</dd><dt>만족도</dt><dd>${'★'.repeat(record.rating || 0)} (${escape(record.rating)}/5)</dd><dt>공개 동의</dt><dd>${record.consent === true ? '동의함' : '동의하지 않음 — 승인·공개 불가'}</dd></dl><blockquote>${escape(record.body)}</blockquote>`;
  }
  function hidden(token) { return Object.entries(token).map(([key,value]) => `<input type="hidden" name="${escape(key)}" value="${escape(value)}">`).join(''); }
  function guarded(handler, isHTML = false) {
    return async req => {
      try { return await handler(req); }
      catch (error) {
        const known = error instanceof ReviewError;
        if (!known) console.error('Review request could not be completed.');
        const message = known ? error.message : '一時的に処理できません。時間をおいて再度お試しください。';
        const status = known ? error.status : 503;
        return isHTML ? html('レビューの確認',`<p role="alert">${escape(message)}</p><p><a href="${ADMIN_PATH}">관리자 페이지</a></p>`,status) : json({error:message},status);
      }
    };
  }
  return {
    admin: guarded(async req => {
      // GET deliberately performs no authentication writes, listing, or minting.
      if (req.method === 'GET') return html('Lian 리뷰 관리',`<p>납품이 완료된 고객에게만 초대 링크를 전달해 주세요. 기존 Kakao 관리자 비밀값으로 관리합니다.</p>${adminForm()}`);
      if (req.method !== 'POST') fail(405,'POST 요청이 필요합니다.');
      configured(); postOrigin(req);
      const input = await body(req);
      if (typeof input.admin_secret !== 'string' || input.admin_secret.length > 512 || !(await secretsMatch(input.admin_secret,env.KAKAO_ADMIN_SECRET))) fail(403,'관리자 인증에 실패했습니다.');
      if (input.operation === 'invite') {
        let orderCount = 1;
        if (Object.hasOwn(input,'orderCount')) {
          const isForm = (req.headers.get('content-type') || '').split(';')[0].trim().toLowerCase() === 'application/x-www-form-urlencoded';
          if (isForm ? typeof input.orderCount !== 'string' || !/^[1-5]$/.test(input.orderCount) : !Number.isInteger(input.orderCount) || input.orderCount < 1 || input.orderCount > 5) fail(422,'의뢰 회차를 1회차부터 5회 이상 중에서 선택해 주세요.');
          orderCount = isForm ? Number(input.orderCount) : input.orderCount;
        }
        const record = {schemaVersion:1,id:uuid(),stage:'invited',status:null,orderCount,createdAt:new Date(now()).toISOString(),invite:{nonce:nonce(),expires:seconds()+INVITE_SECONDS}};
        if (!ID.test(record.id) || !NONCE.test(record.invite.nonce)) fail(503,'초대 링크를 생성하지 못했습니다.');
        await write(record,{onlyIfNew:true});
        const url = new URL('/review',origin()); url.hash = new URLSearchParams(tokenFor(record));
        return html('리뷰 초대 링크',`<p>한 고객만 사용할 수 있으며 14일 동안 유효합니다. 링크를 복사하여 납품 완료 고객에게 개별 전달하세요.</p><p>의뢰 회차: ${orderCountLabel(record.orderCount)}</p><p><a id="review-invite-link" href="${escape(url.href)}">${escape(url.href)}</a></p><p>리뷰 ID: <code>${escape(record.id)}</code></p><p><a href="${ADMIN_PATH}">관리자 처음 화면</a></p>`);
      }
      if (input.operation === 'queue') {
        const records = (await allRecords()).filter(r => r.status === 'pending').sort((a,b)=>String(b.submittedAt).localeCompare(String(a.submittedAt)));
        const items = records.map(record => {
          const current = record.moderation?.expires > seconds();
          const urls = current ? links(record) : null;
          return `<article class="lian-pending-review"><h2>대기 리뷰</h2><p>리뷰 ID: <code>${escape(record.id)}</code></p>${content(record)}${urls ? `<p><a href="${escape(urls.approve)}">승인 확인</a> · <a href="${escape(urls.reject)}">거절 확인</a></p>` : '<p>기존 승인 링크가 만료되었습니다.</p>'}${adminForm('renew',record.id)}</article>`;
        }).join('');
        return html('대기 리뷰',items || '<p>대기 중인 리뷰가 없습니다.</p>');
      }
      if (input.operation === 'renew') {
        if (!ID.test(String(input.review_id || ''))) fail(400,'리뷰 ID를 확인해 주세요.');
        const entry = await read(input.review_id);
        if (entry.data.status !== 'pending') fail(409,'이미 처리되었거나 제출되지 않은 리뷰입니다.');
        const nextNonce = nonce();
        if (!NONCE.test(nextNonce) || equal(nextNonce,entry.data.moderation?.nonce)) fail(503,'새 승인 링크를 생성하지 못했습니다. 다시 시도해 주세요.');
        const record = {...entry.data,moderation:{nonce:nextNonce,expires:seconds()+MODERATION_SECONDS}};
        await write(record,{onlyIfMatch:entry.etag});
        const sent = await send(record); const urls = links(record);
        return html('승인 링크 재발급',`<p>이전 승인·거절 링크는 더 이상 사용할 수 없습니다. 새 링크는 1시간 동안 유효합니다.</p><p>${sent ? '카카오 API가 알림 요청을 정상 처리했습니다.' : '카카오 알림을 확인하지 못했습니다. 아래 링크로 직접 확인할 수 있습니다.'}</p><p><a href="${escape(urls.approve)}">승인 확인</a> · <a href="${escape(urls.reject)}">거절 확인</a></p>`);
      }
      fail(400,'관리 작업을 선택해 주세요.');
    },true),
    checkInvite: guarded(async req => {
      if (req.method !== 'POST') fail(405,'POST 요청이 필요합니다.');
      postOrigin(req); const input = await body(req); const token = validateToken(input.token,'invitation'); const entry = await read(token.id);
      if (!matches(token,entry.data.invite)) fail(403,'無効な招待リンクです。');
      if (entry.data.stage !== 'invited' || entry.data.status !== null) fail(409,'このリンクのレビューはすでに受け付けています。');
      return json({valid:true});
    }),
    submit: guarded(async req => {
      if (req.method !== 'POST') fail(405,'POST 요청이 필요합니다.');
      postOrigin(req); const input = await body(req); const token = validateToken(input.token,'invitation');
      if (input.website !== undefined && input.website !== '') fail(400,'入力内容を確認してください。');
      function field(key, max, required) {
        if (input[key] === undefined && !required) return '';
        if (typeof input[key] !== 'string') fail(422,'入力内容を確認してください。');
        const value = input[key].trim();
        if ((required && !value) || [...value].length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) fail(422,'文字数と入力内容を確認してください。');
        return value;
      }
      const displayName = field('displayName',60,true), songTitle = field('songTitle',120,false), reviewBody = field('body',2000,true);
      if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5 || typeof input.consent !== 'boolean') fail(422,'満足度と公開同意の選択を確認してください。');
      if (Object.hasOwn(input,'anonymousDisplay') && typeof input.anonymousDisplay !== 'boolean') fail(422,'匿名掲載の選択を確認してください。');
      const entry = await read(token.id);
      if (!matches(token,entry.data.invite)) fail(403,'無効な招待リンクです。');
      if (entry.data.stage !== 'invited' || entry.data.status !== null) fail(409,'このリンクはすでに使用されています。');
      // The administrator's stored invitation is the only source of order count.
      const record = {...entry.data,stage:'submitted',status:'pending',displayName,songTitle,rating:input.rating,body:reviewBody,consent:input.consent,anonymousDisplay:input.anonymousDisplay === true,orderCount:orderCountValue(entry.data.orderCount),submittedAt:new Date(now()).toISOString(),moderation:{nonce:nonce(),expires:seconds()+MODERATION_SECONDS}};
      // One atomic record update both consumes the invitation and saves the review.
      await write(record,{onlyIfMatch:entry.etag});
      await send(record);
      return json({ok:true,reviewId:record.id},201);
    }),
    moderate: guarded(async req => {
      if (!['GET','POST'].includes(req.method)) fail(405,'GET 또는 POST 요청이 필요합니다.');
      let input;
      if (req.method === 'GET') {
        const params = new URL(req.url).searchParams;
        if ([...params.keys()].some(key => params.getAll(key).length !== 1)) fail(400,'중복된 링크 항목입니다.');
        input = Object.fromEntries(params);
      } else { postOrigin(req); input = await body(req); }
      const token = validateToken(input,'moderation');
      const entry = await read(token.id); const record = entry.data;
      if (record.status !== 'pending' || !matches(token,record.moderation)) fail(409,'이미 처리되었거나 새 링크가 발급된 리뷰입니다.');
      if (req.method === 'GET') {
        const browserNonce = nonce();
        const csrf = createHmac('sha256',env.REVIEW_HMAC_SECRET).update('review-confirm-v72\n'+token.signature+'\n'+browserNonce).digest('base64url');
        const allowed = token.action !== 'approve' || record.consent === true;
        return html(token.action === 'approve' ? '이 리뷰를 승인하시겠습니까?' : '이 리뷰를 거절하시겠습니까?',`${content(record)}<p>링크를 여는 것만으로는 상태가 변경되지 않습니다.</p><form id="moderation-form" method="POST" action="${MODERATE_PATH}">${hidden(token)}<input type="hidden" name="csrf" value="${escape(csrf)}"><button type="submit"${allowed ? '' : ' disabled'}>${token.action === 'approve' ? '리뷰 승인 · 사이트에 공개' : '리뷰 거절 · 공개하지 않음'}</button></form>`,200,{'set-cookie':`${COOKIE}=${browserNonce}; Max-Age=600; Path=${MODERATE_PATH}; HttpOnly; Secure; SameSite=Lax`});
      }
      const browserNonce = readCookie(req.headers.get('cookie'),COOKIE);
      if (!browserNonce || !NONCE.test(browserNonce)) fail(403,'확인 페이지를 같은 브라우저에서 다시 열어 주세요.');
      const expected = createHmac('sha256',env.REVIEW_HMAC_SECRET).update('review-confirm-v72\n'+token.signature+'\n'+browserNonce).digest('base64url');
      if (!equal(String(input.csrf || ''),expected)) fail(403,'확인 페이지에서 다시 시도해 주세요.');
      if (token.action === 'approve' && record.consent !== true) fail(422,'공개에 동의하지 않은 리뷰는 승인할 수 없습니다.');
      const decidedAt = new Date(now()).toISOString();
      const next = {...record,status:token.action === 'approve' ? 'approved' : 'rejected',moderation:null,decidedAt,...(token.action === 'approve' ? {publishedAt:decidedAt} : {})};
      // Both alternative action links become unusable with this one CAS transition.
      await write(next,{onlyIfMatch:entry.etag});
      return html(token.action === 'approve' ? 'レビューを承認しました。' : 'レビューを非公開にしました。','<p>처리가 완료되었습니다.</p><p><a href="/#reviews">사이트 리뷰 보기</a></p>',200,{'set-cookie':`${COOKIE}=; Max-Age=0; Path=${MODERATE_PATH}; HttpOnly; Secure; SameSite=Lax`});
    },true),
    publicReviews: guarded(async req => {
      if (req.method !== 'GET') fail(405,'GET 요청이 필요합니다.');
      const records = await allRecords();
      const reviews = records.filter(r => r.status === 'approved' && r.consent === true && typeof r.displayName === 'string' && typeof r.body === 'string' && typeof r.publishedAt === 'string' && Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5).sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)).map(r => ({id:r.id,displayName:r.anonymousDisplay === true ? '匿名' : r.displayName,songTitle:typeof r.songTitle === 'string' ? r.songTitle : '',rating:r.rating,body:r.body,publishedAt:r.publishedAt,orderCount:orderCountValue(r.orderCount)}));
      return json({reviews});
    }),
  };
}
