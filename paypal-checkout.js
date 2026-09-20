/* PayPal v6 one-time checkout. Pricing remains in the existing estimator; the
 * server alone determines payment amounts from validated selections. */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const form = document.querySelector('#contact-form');
  const total = document.querySelector('#summary-total');
  const desktop = document.querySelector('.jp-estimate-total');
  const mobile = document.querySelector('.jp-estimate-mini');
  const ids = ['plan-select', 'people-select', 'group-count', 'extra-track-count', 'extra-harmony', 'extra-adlib', 'extra-private', 'rush-select'];
  const controls = ids.map(id => document.getElementById(id));
  if (!form || !total || !desktop || !mobile || controls.some(item => !item)) return;
  const [plan, party, people, tracks, harmony, adlib, privateOption, rush] = controls;
  const narrow = matchMedia('(max-width: 700px)');
  const testQuery = new URLSearchParams(location.search).get('paypal_test') === '1' ? '?paypal_test=1' : '';
  const storageKey = 'lian-paypal-checkout-v1';
  const maxJPY = 999999999999999; // Orders MAX_VALUE_EXCEEDED ceiling, in whole JPY.
  const uncertainCodes = new Set(['PROCESSING', 'PAYMENT_UNCERTAIN', 'PAYMENT_PENDING']);
  const approvalCodes = new Set(['ORDER_NOT_APPROVED', 'INSTRUMENT_DECLINED', 'PAYER_ACTION_REQUIRED']);
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const orderPattern = /^[A-Z0-9]{1,36}$/;
  const validOrderId = value => typeof value === 'string' && orderPattern.test(value);
  let config, section, label, status, buttonHost, officialButton, retry, reset, success, successAmount, successId;
  let sdkPromise, sdk, session, busy = false, flow = false, captureTask = null, record = null, storageAvailable = true;
  let savedDisabled = new Map(), cancelRequested = false, refreshing = false;
  const yen = value => '¥' + new Intl.NumberFormat('ja-JP').format(value);
  const endpoint = name => '/.netlify/functions/paypal-' + name + testQuery;
  const validAmount = value => Number.isSafeInteger(value) && value > 0 && value <= maxJPY;

  function quoteFromControls() {
    const count = party.value === 'solo' ? 1 : party.value === 'duet' ? 2 : Number(people.value);
    const trackCount = Number(tracks.value);
    if (!['light', 'standard', 'deluxe'].includes(plan.value) || !['solo', 'duet', 'group'].includes(party.value)
      || !['none', 'rush48', 'rush24'].includes(rush.value) || !tracks.value.trim()
      || !Number.isSafeInteger(trackCount) || trackCount < 0 || !Number.isSafeInteger(count)
      || (party.value === 'group' && (!people.value.trim() || count < 3))) return null;
    return {
      plan: plan.value, partyType: party.value, participantCount: count, extraVocalTracks: trackCount,
      options: [harmony.checked && 'harmony', adlib.checked && 'adlib', privateOption.checked && 'private'].filter(Boolean),
      rush: rush.value
    };
  }
  function displayedAmount() {
    const match = total.textContent.trim().match(/^¥([0-9,]+)(?:〜)?$/);
    const value = match ? Number(match[1].replaceAll(',', '')) : NaN;
    return validAmount(value) ? value : null;
  }
  function sameQuote(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function unresolved() { return record && ['creating', 'verify', 'capturing', 'pending', 'processing'].includes(record.stage); }
  function tell(message) { if (status) status.textContent = message; }
  function persist() {
    try {
      if (record) sessionStorage.setItem(storageKey, JSON.stringify(record));
      else sessionStorage.removeItem(storageKey);
      return true;
    } catch { storageAvailable = false; return false; }
  }
  function loadRecord() {
    try {
      const stored = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
      if (!stored || typeof stored.checkoutKey !== 'string' || !uuidPattern.test(stored.checkoutKey) || stored.environment !== config.environment
        || !stored.quote || !validAmount(stored.amountJPY) || (stored.orderId != null && !validOrderId(stored.orderId))) return;
      record = {
        checkoutKey: stored.checkoutKey, environment: stored.environment, quote: stored.quote,
        amountJPY: stored.amountJPY, orderId: stored.orderId || null, stage: 'verify'
      };
    } catch { storageAvailable = false; }
  }
  function setBusy(value) {
    if (busy === value) return;
    busy = value;
    const submit = form.querySelector('button[type="submit"]');
    if (value) {
      savedDisabled = new Map([...controls, submit].filter(Boolean).map(control => [control, control.disabled]));
      savedDisabled.forEach((_, control) => { control.disabled = true; });
    } else {
      savedDisabled.forEach((disabled, control) => { control.disabled = disabled; });
      savedDisabled.clear();
    }
    section.setAttribute('aria-busy', String(value));
    render();
  }
  // Keep native Netlify submission intact. Never submit while named price fields
  // are temporarily disabled, including Enter/requestSubmit during checkout.
  form.addEventListener('submit', event => {
    if (!busy) return;
    event.preventDefault(); event.stopImmediatePropagation();
    tell('お支払いの処理が終わってから、相談内容を送信してください。');
  }, true);

  function render() {
    if (!section) return;
    const amount = displayedAmount(), quote = quoteFromControls();
    const complete = record?.stage === 'completed';
    const waiting = Boolean(unresolved());
    label.textContent = complete ? 'お支払い済み' : waiting
      ? `確認中のお支払い：${yen(record.amountJPY)}`
      : amount && quote ? `${yen(amount)} をPayPalで支払う` : 'プラン・人数・追加内容をご確認ください。';
    buttonHost.hidden = complete || waiting || !amount || !quote || !storageAvailable;
    buttonHost.inert = busy;
    buttonHost.setAttribute('aria-disabled', String(busy));
    retry.hidden = !waiting;
    retry.disabled = busy;
    reset.hidden = !complete;
    reset.disabled = busy;
    success.hidden = !complete;
  }
  function moveSection() {
    (narrow.matches ? mobile : desktop).after(section);
  }
  function refreshEstimate() {
    refreshing = true;
    plan.dispatchEvent(new Event('input', { bubbles: true }));
    refreshing = false;
    render();
  }
  function onSelectionChange(event) {
    if (refreshing || !controls.includes(event.target)) return;
    if (record && ['cancelled', 'approval', 'ready'].includes(record.stage) && !sameQuote(record.quote, quoteFromControls())) {
      record = null; persist(); tell('');
    }
    render();
  }
  form.addEventListener('input', onSelectionChange);
  form.addEventListener('change', onSelectionChange);
  form.addEventListener('reset', () => setTimeout(() => { refreshEstimate(); }, 0));
  new MutationObserver(render).observe(total, { childList: true, characterData: true, subtree: true });

  function apiError(code, message, recoverable = false) {
    const error = new Error(message); error.code = code; error.recoverable = recoverable; return error;
  }
  async function post(name, body) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(endpoint(name), {
        method: 'POST', credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'X-Lian-PayPal-CSRF': config.csrfToken },
        body: JSON.stringify(body)
      });
      let data;
      try { data = await response.json(); } catch { throw apiError('PAYMENT_UNCERTAIN', 'お支払いの状況を確認してください。', true); }
      if (!response.ok || data.error) {
        const code = typeof data.error?.code === 'string' ? data.error.code : 'PAYMENT_UNCERTAIN';
        throw apiError(code, '決済を完了できませんでした。', data.error?.recoverable === true);
      }
      return data;
    } catch (error) {
      if (error.code) throw error;
      throw apiError('PAYMENT_UNCERTAIN', '通信が中断されました。お支払いの状況を確認してください。', true);
    } finally { clearTimeout(timeout); }
  }
  function fail(error) {
    if (record?.stage === 'completed') return;
    if (error.code === 'PRICE_CHANGED') {
      if (record) record.stage = 'ready';
      refreshEstimate();
      tell('料金が更新されました。内容をご確認のうえ、もう一度お支払いください。');
    } else if (approvalCodes.has(error.code)) {
      if (record) { record.stage = 'approval'; restoreQuote(record.quote); }
      tell(error.code === 'INSTRUMENT_DECLINED'
        ? 'お支払い方法を利用できませんでした。PayPalで別のお支払い方法をご確認ください。'
        : 'お支払いはまだ完了していません。PayPalボタンから承認をやり直してください。');
    } else if (uncertainCodes.has(error.code) || ['RETRY_EXPIRED', 'PAYMENT_REVIEW_REQUIRED', 'PAYMENT_MISMATCH', 'INVALID_ORDER'].includes(error.code)
      || (unresolved() && !['INVALID_QUOTE', 'INVALID_REQUEST', 'VALIDATION_ERROR', 'UNAVAILABLE', 'FORBIDDEN', 'STORAGE_UNAVAILABLE'].includes(error.code))
      || (record?.orderId && !['INVALID_QUOTE', 'VALIDATION_ERROR'].includes(error.code))) {
      if (record) record.stage = error.code === 'PAYMENT_PENDING' ? 'pending' : 'verify';
      tell(['RETRY_EXPIRED', 'PAYMENT_REVIEW_REQUIRED', 'PAYMENT_MISMATCH', 'INVALID_ORDER'].includes(error.code)
        ? 'お支払いの確認が必要です。新しく支払わず、注文番号を添えてお問い合わせください。'
        : error.code === 'PAYMENT_PENDING'
        ? 'お支払いは確認待ちです。新しい決済をせず、支払い状況をご確認ください。'
        : 'お支払いの結果を確認できていません。重複を避けるため、支払い状況をご確認ください。');
    } else {
      if (record) record.stage = 'ready';
      tell('決済を開始できませんでした。内容を確認し、時間をおいてもう一度お試しください。');
    }
    persist(); render();
  }
  async function createOrder() {
    const quote = quoteFromControls(), amount = displayedAmount();
    if (!quote || !amount) throw apiError('INVALID_QUOTE', '選択内容をご確認ください。');
    if (record && !sameQuote(record.quote, quote)) throw apiError('PRICE_CHANGED', '料金が更新されました。');
    // Re-evaluate with the current JPY amount inside the order promise. start()
    // still runs in the original click, so this await cannot lose popup activation.
    const eligibility = await sdk.findEligibleMethods({ currencyCode: 'JPY', amount: String(amount) });
    if (!eligibility.isEligible('paypal')) throw apiError('SDK_UNAVAILABLE', 'この環境ではPayPal決済をご利用いただけません。');
    if (cancelRequested) throw apiError('CHECKOUT_CANCELLED', '決済はキャンセルされました。');
    if (displayedAmount() !== amount || !sameQuote(quote, quoteFromControls())) throw apiError('PRICE_CHANGED', '料金が更新されました。');
    if (!record) {
      record = { checkoutKey: crypto.randomUUID(), environment: config.environment, quote, amountJPY: amount, orderId: null, stage: 'creating' };
    } else record.stage = 'creating';
    if (!persist()) throw apiError('STORAGE_UNAVAILABLE', 'ブラウザーの保存設定をご確認ください。');
    const result = await post('create-order', { checkoutKey: record.checkoutKey, quote: record.quote });
    if (!validOrderId(result.id) || !validAmount(result.amountJPY) || result.currency !== 'JPY') {
      throw apiError('PAYMENT_UNCERTAIN', 'お支払いの状況を確認してください。', true);
    }
    record.orderId = result.id;
    record.stage = cancelRequested ? 'cancelled' : 'approval';
    record.amountJPY = result.amountJPY;
    if (!persist()) throw apiError('PAYMENT_UNCERTAIN', 'お支払いの状況を確認してください。', true);
    if (result.amountJPY !== amount || displayedAmount() !== amount || !sameQuote(quote, quoteFromControls())) {
      throw apiError('PRICE_CHANGED', '料金が更新されました。');
    }
    if (cancelRequested) throw apiError('CHECKOUT_CANCELLED', '決済はキャンセルされました。');
    return { orderId: result.id };
  }
  function showSuccess(result) {
    if (result.status !== 'COMPLETED' || !validOrderId(result.id) || result.id !== record?.orderId || result.currency !== 'JPY'
      || !validAmount(result.amountJPY) || result.amountJPY !== record.amountJPY) {
      throw apiError('PAYMENT_UNCERTAIN', 'お支払いの状況を確認してください。', true);
    }
    record.stage = 'completed'; persist();
    successAmount.textContent = `お支払い金額：${yen(result.amountJPY)}`;
    successId.textContent = `PayPal注文番号：${result.id}`;
    tell('お支払いが完了しました。');
    render();
    success.focus({ preventScroll: true });
  }
  function captureOrder(orderId) {
    if (captureTask) return captureTask;
    if (record?.stage === 'completed' && orderId === record.orderId) return Promise.resolve();
    if (!record || !validOrderId(orderId) || orderId !== record.orderId) {
      return Promise.reject(apiError('PAYMENT_UNCERTAIN', 'お支払いの状況を確認してください。', true));
    }
    record.stage = 'capturing'; persist(); setBusy(true); tell('お支払いを確認しています…');
    captureTask = (async () => {
      try {
        const result = await post('capture-order', { checkoutKey: record.checkoutKey, orderId });
        showSuccess(result);
      } catch (error) { fail(error); throw error; }
      finally { captureTask = null; if (!flow) setBusy(false); }
    })();
    return captureTask;
  }
  async function beginCheckout() {
    if (busy || flow || unresolved() || record?.stage === 'completed' || !storageAvailable || !session) return;
    if (!quoteFromControls() || !displayedAmount()) { render(); return; }
    flow = true; cancelRequested = false; setBusy(true); tell('PayPalに接続しています…');
    const orderPromise = createOrder();
    // The SDK may close before this promise settles. Consume rejection now and
    // keep the same flow locked until its creation work finishes as well.
    const orderOutcome = orderPromise.then(value => ({value}), error => ({error}));
    let startError;
    try {
      // Do not await order creation before start: preserve click activation.
      await session.start({ presentationMode: 'auto' }, orderPromise);
    } catch (error) {
      startError = error;
      cancelRequested = true;
    } finally {
      const outcome = await orderOutcome;
      const error = outcome.error?.code === 'CHECKOUT_CANCELLED' && startError ? startError : outcome.error || startError;
      if (error?.code === 'CHECKOUT_CANCELLED') {
        if (!captureTask && record?.stage !== 'completed' && !unresolved()) tell('決済はキャンセルされました。');
      } else if (error && record?.stage !== 'completed' && !captureTask) fail(error);
      flow = false;
      if (!captureTask) setBusy(false);
      render();
    }
  }
  async function recover() {
    if (busy || !record) return;
    if (record.orderId) {
      try { await captureOrder(record.orderId); } catch { /* fail() already provides a safe message. */ }
      return;
    }
    setBusy(true); tell('前回のお支払い状況を確認しています…');
    try {
      const result = await post('create-order', { checkoutKey: record.checkoutKey, quote: record.quote });
      if (!validOrderId(result.id) || !validAmount(result.amountJPY) || result.currency !== 'JPY' || result.amountJPY !== record.amountJPY) {
        throw apiError('PAYMENT_UNCERTAIN', 'お支払いの状況を確認してください。', true);
      }
      record.orderId = result.id; record.stage = 'approval';
      if (!persist()) throw apiError('PAYMENT_UNCERTAIN', 'お支払いの状況を確認してください。', true);
      // Display the original selections for explicit approval after recovering
      // a create response. No payment is started by the recovery button.
      restoreQuote(record.quote);
      tell('前回の注文を確認しました。内容をご確認のうえ、PayPalボタンからお進みください。');
    } catch (error) { fail(error); }
    finally { setBusy(false); }
  }
  function restoreQuote(quote) {
    refreshing = true;
    plan.value = quote.plan; party.value = quote.partyType;
    if (quote.partyType === 'group') people.value = String(quote.participantCount);
    tracks.value = String(quote.extraVocalTracks); rush.value = quote.rush;
    harmony.checked = quote.options?.includes('harmony') === true;
    adlib.checked = quote.options?.includes('adlib') === true;
    privateOption.checked = quote.options?.includes('private') === true;
    plan.dispatchEvent(new Event('input', { bubbles: true })); refreshing = false;
  }
  function buildSection() {
    section = document.createElement('section');
    section.className = 'jp-paypal'; section.id = 'jp-paypal-checkout';
    section.setAttribute('aria-labelledby', 'jp-paypal-heading'); section.setAttribute('aria-busy', 'false');
    section.innerHTML = '<h4 id="jp-paypal-heading">PayPalでお支払い</h4>'
      + '<p class="jp-paypal-sandbox" hidden>Sandbox テスト決済（実際の請求はありません）</p>'
      + '<p class="jp-paypal-note">入力内容に基づく自動計算額です。録音状態・作業内容により追加料金が必要な場合は、作業開始前にご案内します。</p>'
      + '<p class="jp-paypal-amount"></p><div class="jp-paypal-buttons"></div>'
      + '<p class="jp-paypal-status" role="status" aria-live="polite" aria-atomic="true"></p>'
      + '<button class="jp-paypal-retry" type="button" hidden>支払い状況を確認</button>'
      + '<div class="jp-paypal-success" tabindex="-1" hidden><strong>お支払いが完了しました。</strong>'
      + '<p class="jp-paypal-success-amount"></p><p class="jp-paypal-success-id"></p>'
      + '<p>作業内容を確認後、ご連絡いたします。</p></div>'
      + '<button class="jp-paypal-reset" type="button" hidden>新しい見積りでお支払い</button>';
    section.querySelector('.jp-paypal-sandbox').hidden = config.environment !== 'sandbox';
    label = section.querySelector('.jp-paypal-amount'); status = section.querySelector('.jp-paypal-status');
    buttonHost = section.querySelector('.jp-paypal-buttons'); retry = section.querySelector('.jp-paypal-retry');
    reset = section.querySelector('.jp-paypal-reset'); success = section.querySelector('.jp-paypal-success');
    successAmount = section.querySelector('.jp-paypal-success-amount'); successId = section.querySelector('.jp-paypal-success-id');
    retry.addEventListener('click', recover);
    reset.addEventListener('click', () => {
      if (busy || record?.stage !== 'completed') return;
      record = null; persist(); tell('新しいお支払い内容をご確認ください。'); render(); plan.focus();
    });
    moveSection(); narrow.addEventListener('change', moveSection); render();
  }
  function loadSDK() {
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.async = true;
      script.id = 'lian-paypal-sdk-v6';
      script.src = config.environment === 'sandbox' ? 'https://www.sandbox.paypal.com/web-sdk/v6/core' : 'https://www.paypal.com/web-sdk/v6/core';
      script.onload = resolve; script.onerror = () => reject(apiError('SDK_UNAVAILABLE', '決済を読み込めませんでした。'));
      document.head.append(script);
    });
    return sdkPromise;
  }
  async function initialize() {
    try {
      const response = await fetch(endpoint('config'), { credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) return;
      const value = await response.json();
      if (value.enabled !== true || !['sandbox', 'live'].includes(value.environment) || value.currency !== 'JPY'
        || typeof value.clientId !== 'string' || !value.clientId || typeof value.csrfToken !== 'string' || !value.csrfToken) return;
      config = value;
      loadRecord(); buildSection();
      if (record) tell('前回のお支払いがあります。新しい決済の前に、支払い状況をご確認ください。');
      if (!storageAvailable) { tell('決済の重複を防ぐため、ブラウザーの保存設定を確認して再読み込みしてください。'); return; }
      await loadSDK();
      sdk = await window.paypal.createInstance({ clientId: config.clientId, components: ['paypal-payments'] });
      const eligibility = await sdk.findEligibleMethods({ currencyCode: 'JPY', ...(displayedAmount() ? { amount: String(displayedAmount()) } : {}) });
      if (!eligibility.isEligible('paypal')) { tell('この環境ではPayPal決済をご利用いただけません。'); return; }
      session = await sdk.createPayPalOneTimePaymentSession({
        onApprove: data => captureOrder(data.orderId),
        onCancel: () => {
          if (captureTask || ['capturing', 'completed', 'pending', 'verify', 'processing'].includes(record?.stage)) return;
          cancelRequested = true;
          if (record?.orderId && !unresolved()) record.stage = 'cancelled';
          persist(); tell('決済はキャンセルされました。'); render();
        },
        onError: error => {
          if (captureTask || record?.stage === 'completed') return;
          if (cancelRequested) return;
          fail(error);
        }
      });
      officialButton = document.createElement('paypal-button');
      officialButton.setAttribute('type', 'pay'); officialButton.className = 'paypal-gold';
      officialButton.addEventListener('click', beginCheckout); buttonHost.append(officialButton); render();
    } catch {
      if (section) tell('決済を読み込めませんでした。時間をおいてページを再読み込みしてください。');
    }
  }
  initialize();
});
