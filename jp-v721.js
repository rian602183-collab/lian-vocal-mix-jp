document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#contact-form');
  const sns = document.querySelector('#sns-id'), email = document.querySelector('#email');
  const contactError = document.querySelector('#contact-method-error');
  let contactRevealed = false;
  function contacts(reveal = false) {
    if (!sns || !email) return true;
    const missing = !sns.value.trim() && !email.value.trim();
    const message = 'X / SNS ID またはメールアドレスのどちらかを入力してください。';
    contactRevealed ||= reveal;
    sns.setCustomValidity(missing ? message : '');
    for (const field of [sns,email]) field.setAttribute('aria-invalid', String(missing && contactRevealed));
    if (contactError) { contactError.textContent = missing && contactRevealed ? message : ''; contactError.hidden = !missing || !contactRevealed; }
    return !missing;
  }
  for (const field of [sns,email]) field?.addEventListener('input', () => contacts());
  form?.addEventListener('invalid', () => contacts(true), true);
  contacts();

  // Display terminology follows the option labels. The legacy calculator and
  // its hidden notification values remain unchanged.
  const extraSummary = document.querySelector('#summary-extra');
  const extraMail = document.querySelector('#mail-estimate-extra');
  function extraTerminology() {
    if (!extraSummary || !extraMail) return;
    extraSummary.textContent = extraMail.value
      .replace('追加track', '追加ボーカルトラック')
      .replace('ハモリ・コーラス', '基本範囲を超える多数のハモリ・コーラス')
      .replace('ダブル・アドリブ', '基本範囲を超えるダブル・アドリブの追加整理')
      .replace('非公開', 'サンプル・ポートフォリオ完全非公開');
  }
  form?.addEventListener('input', extraTerminology);
  form?.addEventListener('change', extraTerminology);
  extraTerminology();

  const submit = form?.querySelector('button[type="submit"]');
  const submitLabel = submit?.textContent;
  let sending = false;
  function restoreSubmission() {
    sending = false;
    if (submit) { submit.disabled = false; submit.removeAttribute('aria-disabled'); submit.textContent = submitLabel; }
    form?.removeAttribute('aria-busy');
  }
  form?.addEventListener('submit', event => {
    if (!contacts(true)) { event.preventDefault(); sns.focus(); return; }
    // V7.2's date listener runs first. Keep the native Netlify POST and every
    // successful control enabled; only the unnamed submit button is locked.
    if (event.defaultPrevented || !form.checkValidity()) return;
    if (sending) { event.preventDefault(); return; }
    sending = true; form.setAttribute('aria-busy','true');
    submit.disabled = true; submit.setAttribute('aria-disabled','true'); submit.textContent = '送信中…';
    // A browser may run a microtask checkpoint between separate event listeners.
    // Wait for the whole dispatch, including later cancellation listeners.
    setTimeout(() => { if (event.defaultPrevented) restoreSubmission(); },0);
  });
  addEventListener('pageshow', () => { restoreSubmission(); contacts(); });
  form?.addEventListener('reset', () => setTimeout(() => { contactRevealed = false; restoreSubmission(); contacts(); updateRushHint(); },0));

  const deadline = document.querySelector('#deadline-display'), iso = document.querySelector('#deadline-input');
  const rush = document.querySelector('#rush-select'), rushHint = document.querySelector('#deadline-rush-hint');
  function updateRushHint() {
    if (!deadline || !iso || !rush || !rushHint) return;
    const today = new Date(); today.setHours(0,0,0,0);
    const requested = /^\d{4}-\d{2}-\d{2}$/.test(iso.value) ? new Date(iso.value+'T00:00:00') : null;
    const days = requested ? Math.round((requested-today)/86400000) : -1;
    const near = deadline.validity.valid && requested && days >= 0 && days <= 2 && rush.value === 'none';
    rushHint.hidden = !near;
    rushHint.textContent = near ? 'お急ぎの場合は、48時間以内 / 当日納品オプションもご確認ください。' : '';
  }
  deadline?.addEventListener('input',updateRushHint); deadline?.addEventListener('blur',updateRushHint); rush?.addEventListener('change',updateRushHint);
  updateRushHint();

  // Keep the tested legacy click handlers; add keyboard and tabpanel semantics.
  for (const [attribute,prefix] of [['data-work-filter','work'],['data-guide-filter','guide']]) {
    const tabs = [...document.querySelectorAll('['+attribute+']')];
    function sync() {
      for (const tab of tabs) {
        const selected = tab.getAttribute('aria-selected') === 'true';
        tab.tabIndex = selected ? 0 : -1;
        const pane = document.getElementById(prefix+'-pane-'+tab.getAttribute(attribute));
        if (pane) pane.hidden = !selected;
      }
    }
    tabs.forEach((tab,index) => {
      tab.addEventListener('click',sync);
      tab.addEventListener('keydown',event => {
        if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length-1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        tabs[next].focus({preventScroll:true}); tabs[next].click();
      });
    });
    sync();
  }

  // Native exclusive details are a progressive enhancement: older browsers keep
  // ordinary, fully usable multi-open details. Desktop remains multi-open.
  const faq = [...document.querySelectorAll('.jp-faq details')];
  const narrow = matchMedia('(max-width: 700px)');
  function faqMode() { faq.forEach(item => narrow.matches ? item.setAttribute('name','lian-mobile-faq') : item.removeAttribute('name')); }
  faqMode(); narrow.addEventListener('change',faqMode);
  const nav = document.querySelector('.jp-click-nav-wrap');
  if (nav && typeof ResizeObserver === 'function') new ResizeObserver(() => document.body.style.setProperty('--v721-nav-height',nav.getBoundingClientRect().height+'px')).observe(nav);
  const header = document.querySelector('.site-header');
  if (header && typeof ResizeObserver === 'function') {
    const headerSize = () => { if (narrow.matches) document.body.style.setProperty('--lian-header',header.getBoundingClientRect().height+'px'); else document.body.style.removeProperty('--lian-header'); };
    new ResizeObserver(headerSize).observe(header); narrow.addEventListener('change',headerSize);
  }

  // Temporarily hide only the minimized launcher over the site's own sample or
  // confirmation card. No iframe access or undocumented placement attributes.
  const protectedCards = [...document.querySelectorAll('.jp-feature-card, .jp-thanks-card')];
  const formWrap = document.querySelector('#contact-form-wrap');
  let hiddenByCard = false, requestedChat = false, scheduled = false;
  const bound = new WeakSet();
  function visible(el) {
    if (!el || el.hidden) return false;
    const box = el.getBoundingClientRect(), vv = window.visualViewport;
    const top = vv?.offsetTop || 0, bottom = top + (vv?.height || innerHeight);
    return box.bottom > top + 66 && box.top < bottom;
  }
  function applyLauncher() {
    scheduled = false;
    const api = window.Tawk_API;
    if (!api || typeof api.hideWidget !== 'function' || typeof api.showWidget !== 'function') return;
    if (!bound.has(api)) {
      bound.add(api); const previous = api.onChatMinimized;
      api.onChatMinimized = function(...args) { previous?.apply(this,args); requestedChat = false; schedule(); };
    }
    if (requestedChat || api.isChatMaximized?.()) return;
    const shouldHide = narrow.matches && protectedCards.some(visible);
    if (shouldHide) { if (!hiddenByCard || (api.isChatHidden && !api.isChatHidden())) api.hideWidget(); hiddenByCard = true; }
    else if (hiddenByCard && !(narrow.matches && visible(formWrap))) { api.showWidget(); hiddenByCard = false; }
  }
  function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(applyLauncher); } }
  document.addEventListener('click', event => {
    if (!event.target.closest?.('[data-open-livechat]')) return;
    const api = window.Tawk_API;
    if (typeof api?.maximize === 'function') { requestedChat = true; hiddenByCard = false; api.showWidget?.(); }
  },true);
  // Thanks has no legacy jp.js; its small CTA opens through the supported API.
  if (!form && protectedCards.length) document.querySelectorAll('[data-open-livechat]').forEach(button => button.addEventListener('click',() => {
    if (typeof window.Tawk_API?.maximize === 'function') window.Tawk_API.maximize();
    else { const fallback = document.querySelector('#thanks-chat-fallback'); if (fallback) fallback.hidden = false; }
  }));
  const api = window.Tawk_API = window.Tawk_API || {};
  const previousLoad = api.onLoad;
  api.onLoad = function(...args) { previousLoad?.apply(this,args); document.querySelectorAll('[data-chat-fallback], #thanks-chat-fallback').forEach(fallback => { fallback.hidden = true; }); schedule(); };
  addEventListener('scroll',schedule,{passive:true}); addEventListener('resize',schedule);
  window.visualViewport?.addEventListener('resize',schedule); window.visualViewport?.addEventListener('scroll',schedule);
  if (formWrap) new MutationObserver(schedule).observe(formWrap,{attributes:true,attributeFilter:['hidden']});
  const ready = setInterval(() => { schedule(); if (typeof window.Tawk_API?.hideWidget === 'function') clearInterval(ready); },1000);
  schedule();
});
