(() => {
  // A second invitation opened in this tab can be a same-document fragment
  // navigation. Reload that URL to initialize a fresh, isolated form/token.
  addEventListener('hashchange', () => { if (location.hash) location.reload(); });
  const form = document.querySelector('#review-form');
  const fields = document.querySelector('#review-fields');
  const state = document.querySelector('#review-state');
  const retry = document.querySelector('#review-retry');
  const hash = new URLSearchParams(location.hash.slice(1));
  const token = Object.fromEntries(['id','expires','nonce','signature'].map(key => [key,hash.get(key) || '']));
  // The invitation remains in this page's memory only, not URL/logs/storage.
  if (location.hash) history.replaceState(null,'',location.pathname);
  let busy = false;
  async function request(endpoint, payload) {
    const response = await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',cache:'no-store',body:JSON.stringify(payload)});
    const result = await response.json();
    if (!response.ok) { const error = new Error(typeof result.error === 'string' ? result.error : '処理できませんでした。時間をおいて再度お試しください。'); error.status = response.status; throw error; }
    return result;
  }
  async function check() {
    retry.hidden = true;
    if (!Object.values(token).every(Boolean)) { state.textContent = 'このページは、納品後にお送りする専用リンクから開いてください。'; return; }
    try {
      await request('/.netlify/functions/reviews-invite-check',{token});
      form.hidden = false; fields.disabled = false;
      state.textContent = 'ご入力いただく内容をご確認のうえ、送信してください。';
    } catch (error) { state.textContent = error.status ? error.message : 'リンクを確認できませんでした。通信環境をご確認ください。'; retry.hidden = Boolean(error.status && error.status < 500); }
  }
  retry.addEventListener('click',check);
  form.addEventListener('submit',async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    const data = new FormData(form);
    const consent = data.get('consent') === 'on';
    const anonymousDisplay = data.get('anonymousDisplay') === 'on';
    busy = true; fields.disabled = true; state.textContent = 'レビューを送信しています。';
    try {
      await request('/.netlify/functions/reviews-submit',{token,displayName:data.get('displayName'),songTitle:data.get('songTitle'),rating:Number(data.get('rating')),body:data.get('body'),consent,anonymousDisplay,website:data.get('website') || ''});
      form.hidden = true;
      state.textContent = consent ? 'ご感想ありがとうございます。内容を確認後、公開させていただく場合があります。' : 'ご感想ありがとうございます。感想を受け付けました。サイトには公開されません。';
    } catch (error) {
      state.textContent = error.status ? error.message : '送信結果を確認できませんでした。時間をおいて再度お試しいただくか、Lianへお問い合わせください。';
      if ([403,409,410].includes(error.status)) form.hidden = true;
      else fields.disabled = false;
    } finally { busy = false; }
  });
  check();
})();
