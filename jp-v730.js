/* ============================================================
   Lian Vocal MIX JP V7.3 — Consultation Conversion Patch
   Uses only documented Tawk JavaScript APIs. No iframe/DOM access.
   ============================================================ */

(() => {
  const api = window.Tawk_API = window.Tawk_API || {};
  const chain = (name, eventName) => {
    const previous = api[name];
    api[name] = function (...args) {
      if (typeof previous === 'function') previous.apply(this, args);
      document.dispatchEvent(new CustomEvent(eventName, { detail: args[0] }));
    };
  };
  chain('onLoad', 'lian:tawk-load');
  chain('onStatusChange', 'lian:tawk-status');
  chain('onChatMaximized', 'lian:tawk-maximized');
})();

document.addEventListener('DOMContentLoaded', () => {
  const quickForm = document.querySelector('#quick-consult-form');
  const quickReply = document.querySelector('#quick-reply-to');
  const quickDeadline = document.querySelector('#quick-deadline');
  const chatStatusNodes = [...document.querySelectorAll('[data-chat-status]')];
  const fallback = document.querySelector('[data-chat-fallback]');
  const quickRoot = document.querySelector('#quick-consult');

  const intentMessages = {
    pricing: '料金・納期を確認したいです。',
    mix: 'MIXについて相談したいです。',
    recording: '録音データについて相談したいです。'
  };
  const intentRadioMap = {
    pricing: '30秒相談 · 料金・納期',
    mix: '30秒相談 · MIX相談',
    recording: '30秒相談 · 録音相談'
  };

  let pendingChatMessage = '';
  let currentChatStatus = 'loading';

  function trimValue(value, max = 1000) {
    return String(value || '').slice(0, max);
  }

  function contextValues() {
    const params = new URLSearchParams(location.search);
    return {
      page_url: trimValue(location.href, 1600),
      referrer: trimValue(document.referrer, 1600),
      utm_source: trimValue(params.get('utm_source'), 255),
      utm_medium: trimValue(params.get('utm_medium'), 255),
      utm_campaign: trimValue(params.get('utm_campaign'), 255),
      chat_status: currentChatStatus
    };
  }

  function fillContextFields() {
    const values = contextValues();
    document.querySelectorAll('[data-context]').forEach(input => {
      const key = input.dataset.context;
      if (Object.prototype.hasOwnProperty.call(values, key)) input.value = values[key];
    });
  }

  function todayIso() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }
  if (quickDeadline) quickDeadline.min = todayIso();

  function setStatus(status) {
    const normalized = ['online', 'away', 'offline'].includes(status) ? status : 'loading';
    currentChatStatus = normalized;
    const copy = {
      loading: 'チャット接続状況を確認中…。30秒フォームはいつでも送信できます。',
      online: 'チャット受付中です。返信まで少しお待ちいただく場合があります。',
      away: 'ただいま離席中の可能性があります。確実に返信を受けたい場合は30秒フォームがおすすめです。',
      offline: '現在チャットはオフラインです。30秒フォームならいつでも送信できます。'
    }[normalized];
    chatStatusNodes.forEach(node => {
      node.dataset.status = normalized;
      node.textContent = copy;
    });
    fillContextFields();
  }

  function apiReady() {
    return Boolean(window.Tawk_API && typeof window.Tawk_API.maximize === 'function');
  }

  function readTawkStatus() {
    const api = window.Tawk_API;
    if (!api || typeof api.getStatus !== 'function') return null;
    try { return api.getStatus(); } catch { return null; }
  }

  function syncStatus() {
    const status = readTawkStatus();
    if (status) setStatus(status);
    else if (!apiReady()) setStatus('loading');
  }

  function selectQuickIntent(intent) {
    const wanted = intentRadioMap[intent];
    if (!wanted || !quickForm) return;
    const radio = [...quickForm.querySelectorAll('input[name="plan"]')].find(input => input.value === wanted);
    if (radio) radio.checked = true;
  }

  function scrollToQuickForm(message) {
    selectQuickIntent(message === intentMessages.pricing ? 'pricing' : message === intentMessages.recording ? 'recording' : 'mix');
    if (fallback) fallback.hidden = true;
    const motion = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    quickRoot?.scrollIntoView({ behavior: motion, block: 'start' });
    setTimeout(() => quickReply?.focus({ preventScroll: true }), motion === 'auto' ? 0 : 350);
  }

  function recordIntent(intent) {
    const api = window.Tawk_API;
    if (typeof api?.addEvent !== 'function') return;
    try {
      api.addEvent('consult-intent', {
        intent: trimValue(intent, 60),
        source: 'v73-site',
        page: trimValue(location.pathname || '/', 120)
      }, () => {});
    } catch { /* analytics metadata must never block consultation */ }
  }

  function prefillPendingMessage() {
    if (!pendingChatMessage) return;
    const api = window.Tawk_API;
    if (typeof api?.setChatInputMessage !== 'function') return;
    const message = pendingChatMessage;
    try {
      api.setChatInputMessage(message, error => {
        if (!error && pendingChatMessage === message) pendingChatMessage = '';
      });
    } catch { /* keep the pending copy for a later retry */ }
  }

  // Capture phase lets V7.3 route an explicitly offline chat request to the
  // site's lightweight form before legacy click handlers try to maximize Tawk.
  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-chat-intent]');
    if (!button) return;
    const intent = button.dataset.chatIntent || 'mix';
    const message = intentMessages[intent] || intentMessages.mix;
    selectQuickIntent(intent);

    const status = readTawkStatus();
    if (status === 'offline') {
      event.preventDefault();
      event.stopImmediatePropagation();
      setStatus('offline');
      scrollToQuickForm(message);
      return;
    }

    if (!apiReady()) return; // Legacy handler exposes the load-failure fallback.
    pendingChatMessage = message;
    recordIntent(intent);
    prefillPendingMessage();
    setTimeout(prefillPendingMessage, 180);
  }, true);

  document.addEventListener('lian:tawk-load', () => {
    syncStatus();
    prefillPendingMessage();
  });
  document.addEventListener('lian:tawk-status', event => setStatus(event.detail));
  document.addEventListener('lian:tawk-maximized', () => setTimeout(prefillPendingMessage, 50));

  // Tawk is async and older callbacks in previous versions are intentionally kept.
  // A small poll also covers the case where the widget finished loading before this
  // listener was attached.
  let attempts = 0;
  const statusTimer = setInterval(() => {
    attempts += 1;
    syncStatus();
    if (apiReady() && attempts >= 4) clearInterval(statusTimer);
    if (attempts >= 30) clearInterval(statusTimer);
  }, 500);
  syncStatus();

  if (quickForm) {
    const submit = quickForm.querySelector('button[type="submit"]');
    const submitLabel = submit?.textContent || '30秒相談を送信する';
    let sending = false;

    function restoreSubmit() {
      sending = false;
      quickForm.removeAttribute('aria-busy');
      if (submit) {
        submit.disabled = false;
        submit.removeAttribute('aria-disabled');
        submit.textContent = submitLabel;
      }
    }

    quickForm.addEventListener('submit', event => {
      fillContextFields();
      const reply = quickReply?.value.trim() || '';
      if (reply.length < 2) {
        event.preventDefault();
        quickReply?.setCustomValidity('XのID・プロフィールURL・メールアドレスのいずれかを入力してください。');
        quickReply?.reportValidity();
        quickReply?.focus();
        return;
      }
      quickReply?.setCustomValidity('');
      if (event.defaultPrevented || !quickForm.checkValidity()) return;
      if (sending) { event.preventDefault(); return; }
      sending = true;
      quickForm.setAttribute('aria-busy', 'true');
      if (submit) {
        submit.disabled = true;
        submit.setAttribute('aria-disabled', 'true');
        submit.textContent = '送信中…';
      }
      setTimeout(() => { if (event.defaultPrevented) restoreSubmit(); }, 0);
    });

    quickReply?.addEventListener('input', () => quickReply.setCustomValidity(''));
    addEventListener('pageshow', restoreSubmit);
  }

  fillContextFields();
});
