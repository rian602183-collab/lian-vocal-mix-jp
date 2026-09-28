(() => {
  const ENDPOINT = '/.netlify/functions/operator-translate';
  const state = {
    key: sessionStorage.getItem('lianTranslatorKey') || '',
    timers: new Map(),
    controllers: new Map(),
    running: new Map(),
    lastSignatures: new Map(),
  };

  const $ = selector => document.querySelector(selector);
  const authCard = $('#auth-card');
  const authForm = $('#auth-form');
  const authInput = $('#access-key');
  const authStatus = $('#auth-status');
  const workspace = $('#workspace');
  const providerPill = $('#provider-pill');
  const autoToggle = $('#auto-translate');
  const reverseToggle = $('#reverse-check');
  const lockButton = $('#lock-button');

  const panes = {
    incoming: {
      source: $('#incoming-source'), result: $('#incoming-result'), status: $('#incoming-status'), warnings: $('#incoming-warnings'),
      direction: 'ja-ko', back: null,
    },
    outgoing: {
      source: $('#outgoing-source'), result: $('#outgoing-result'), status: $('#outgoing-status'), warnings: $('#outgoing-warnings'),
      direction: 'ko-ja', back: $('#back-result'),
    },
  };

  function setProvider(text, kind = 'locked') {
    providerPill.textContent = text;
    providerPill.dataset.state = kind;
  }

  function setStatus(pane, text, error = false) {
    pane.status.textContent = text;
    pane.status.dataset.error = error ? 'true' : 'false';
  }

  function renderWarnings(pane, warnings = []) {
    pane.warnings.replaceChildren();
    if (!warnings.length) { pane.warnings.hidden = true; return; }
    pane.warnings.hidden = false;
    const list = document.createElement('ul');
    list.style.margin = '0'; list.style.paddingLeft = '18px';
    warnings.forEach(value => { const li = document.createElement('li'); li.textContent = value; list.append(li); });
    pane.warnings.append(list);
  }

  async function api(path = '', options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set('X-Lian-Translator-Key', state.key);
    if (options.body) headers.set('Content-Type', 'application/json');
    const response = await fetch(ENDPOINT + path, { ...options, headers, cache: 'no-store' });
    let body = {};
    try { body = await response.json(); } catch { /* status handled below */ }
    if (!response.ok) {
      const error = new Error(body.message || body.error || `HTTP_${response.status}`);
      error.code = body.error || '';
      error.status = response.status;
      error.field = body.field || '';
      throw error;
    }
    return body;
  }

  async function unlock(key) {
    state.key = key.trim();
    if (!state.key) return false;
    authStatus.textContent = '확인 중…';
    authStatus.dataset.error = 'false';
    try {
      const health = await api('', { method: 'GET' });
      if (!health.configured) throw Object.assign(new Error('Netlify에 DEEPL_API_KEY를 설정해야 합니다.'), { code: 'SETUP_REQUIRED' });
      sessionStorage.setItem('lianTranslatorKey', state.key);
      authCard.hidden = true;
      workspace.hidden = false;
      setProvider(`DeepL 연결됨 · 최대 ${health.maxTextChars}자`, 'ready');
      authStatus.textContent = '';
      return true;
    } catch (error) {
      sessionStorage.removeItem('lianTranslatorKey');
      state.key = '';
      authStatus.textContent = error.code === 'UNAUTHORIZED' ? '비밀번호가 맞지 않습니다.' : error.message;
      authStatus.dataset.error = 'true';
      setProvider('설정 확인 필요', 'error');
      return false;
    }
  }

  function lock() {
    for (const controller of state.controllers.values()) controller.abort();
    state.controllers.clear(); state.timers.forEach(clearTimeout); state.timers.clear();
    sessionStorage.removeItem('lianTranslatorKey'); state.key = '';
    workspace.hidden = true; authCard.hidden = false; authInput.value = ''; authInput.focus();
    setProvider('잠김', 'locked');
  }

  async function translate(name) {
    const pane = panes[name];
    const text = pane.source.value.trim();
    const verify = name === 'outgoing' && reverseToggle.checked;
    const signature = `${pane.direction}|${verify ? '1' : '0'}|${text}`;
    if (!text) {
      state.lastSignatures.delete(name);
      pane.result.value = ''; if (pane.back) pane.back.value = ''; renderWarnings(pane); setStatus(pane, ''); return;
    }
    if (state.lastSignatures.get(name) === signature) return;
    state.controllers.get(name)?.abort();
    const controller = new AbortController(); state.controllers.set(name, controller);
    state.running.set(name, true);
    setStatus(pane, '번역 중…'); renderWarnings(pane);
    document.querySelector(`[data-run="${name}"]`)?.setAttribute('disabled', '');
    try {
      const data = await api('', {
        method: 'POST', signal: controller.signal,
        body: JSON.stringify({ text, direction: pane.direction, verify }),
      });
      pane.result.value = data.translation || '';
      if (pane.back) pane.back.value = data.backTranslation || '';
      renderWarnings(pane, data.warnings || []);
      state.lastSignatures.set(name, signature);
      setStatus(pane, `완료${data.billedCharacters ? ` · 이번 요청 ${data.billedCharacters.toLocaleString()}자` : ''}`);
    } catch (error) {
      if (error.name === 'AbortError') return;
      setStatus(pane, error.code === 'UNAUTHORIZED' ? '잠금이 만료되었습니다. 다시 잠금을 해제하세요.' : error.message, true);
      if (error.code === 'UNAUTHORIZED') lock();
    } finally {
      if (state.controllers.get(name) === controller) state.controllers.delete(name);
      state.running.set(name, false);
      document.querySelector(`[data-run="${name}"]`)?.removeAttribute('disabled');
    }
  }

  function schedule(name) {
    document.querySelector(`[data-counter="${name}"]`).textContent = `${panes[name].source.value.length} / 4000`;
    if (!autoToggle.checked) return;
    clearTimeout(state.timers.get(name));
    state.timers.set(name, setTimeout(() => translate(name), 650));
  }

  async function copyResult(name) {
    const text = panes[name].result.value;
    if (!text) return;
    try { await navigator.clipboard.writeText(text); setStatus(panes[name], '클립보드에 복사했습니다.'); }
    catch { panes[name].result.focus(); panes[name].result.select(); setStatus(panes[name], '복사가 차단되었습니다. 선택된 문장을 직접 복사하세요.', true); }
  }

  async function pasteSource(name) {
    try {
      const text = await navigator.clipboard.readText();
      panes[name].source.value = text.slice(0, 4000); schedule(name); panes[name].source.focus();
    } catch { setStatus(panes[name], '브라우저가 클립보드 읽기를 차단했습니다. 입력칸을 길게 눌러 붙여넣으세요.', true); }
  }

  authForm.addEventListener('submit', event => { event.preventDefault(); unlock(authInput.value); });
  lockButton.addEventListener('click', lock);
  Object.entries(panes).forEach(([name, pane]) => {
    pane.source.addEventListener('input', () => schedule(name));
    document.querySelector(`[data-run="${name}"]`).addEventListener('click', () => translate(name));
    document.querySelector(`[data-copy="${name}"]`).addEventListener('click', () => copyResult(name));
    document.querySelector(`[data-paste="${name}"]`).addEventListener('click', () => pasteSource(name));
    document.querySelector(`[data-clear="${name}"]`).addEventListener('click', () => {
      state.lastSignatures.delete(name); pane.source.value = ''; pane.result.value = ''; if (pane.back) pane.back.value = ''; renderWarnings(pane); setStatus(pane, ''); schedule(name);
    });
  });
  reverseToggle.addEventListener('change', () => { if (panes.outgoing.source.value.trim() && autoToggle.checked) schedule('outgoing'); });

  if (state.key) unlock(state.key); else authInput.focus();
})();
