document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#contact-form');
  const display = document.querySelector('#deadline-display');
  const iso = document.querySelector('#deadline-input');
  const error = document.querySelector('#deadline-error');
  // A text control prevents browser/OS-localized date segments appearing in JP UI.
  function updateDate({ reveal = false, normalize = false } = {}) {
    if (!display || !iso) return true;
    const text = display.value.trim().replace(/^(\d{4})(\d{2})(\d{2})$/, '$1/$2/$3');
    let message = '', value = '';
    if (text) {
      const match = /^(\d{4})([/-])(\d{2})\2(\d{2})$/.exec(text);
      if (!match) message = 'YYYY/MM/DDの形式で入力してください。';
      else {
        const year = Number(match[1]), month = Number(match[3]), day = Number(match[4]);
        const date = new Date(0); date.setFullYear(year, month - 1, day); date.setHours(0, 0, 0, 0);
        if (year < 1 || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) message = '実在する日付を入力してください。';
        else {
          value = `${match[1]}-${match[3]}-${match[4]}`;
          const today = new Date();
          const minimum = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
          if (value < minimum) { message = '本日以降の日付を入力してください。'; value = ''; }
          else if (normalize) display.value = value.replaceAll('-', '/');
        }
      }
    }
    iso.value = message ? '' : value;
    display.setCustomValidity(message);
    display.setAttribute('aria-invalid', String(Boolean(message)));
    if (error) { error.textContent = reveal ? message : ''; error.hidden = !reveal || !message; }
    return !message;
  }
  display?.addEventListener('input', () => updateDate());
  display?.addEventListener('blur', () => updateDate({ reveal: true, normalize: true }));
  display?.addEventListener('invalid', () => updateDate({ reveal: true }));
  form?.addEventListener('submit', event => {
    if (!updateDate({ reveal: true, normalize: true })) { event.preventDefault(); display.focus(); }
  });
  form?.addEventListener('reset', () => setTimeout(() => updateDate(), 0));
  updateDate();

  // Only the new approved review section is populated; the five CREPE reviews stay.
  const reviewsPanel = document.querySelector('#reviews');
  const approved = document.querySelector('#jp-approved-reviews');
  const list = document.querySelector('[data-approved-review-list]');
  let loading = false;
  async function loadApproved() {
    if (!reviewsPanel || reviewsPanel.hidden || document.hidden || loading || !list) return;
    loading = true;
    try {
      const response = await fetch('/.netlify/functions/reviews-public', { cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) return;
      const payload = await response.json();
      if (!Array.isArray(payload.reviews)) return;
      const cards = [];
      for (const review of payload.reviews) {
        if (!review || typeof review.displayName !== 'string' || typeof review.body !== 'string' || !Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5) continue;
        const card = document.createElement('article');
        const rating = document.createElement('b');
        rating.textContent = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        rating.setAttribute('aria-label', `満足度 5点中${review.rating}点`);
        const body = document.createElement('p'); body.textContent = review.body;
        card.append(rating, body);
        if (typeof review.songTitle === 'string' && review.songTitle) {
          const song = document.createElement('p'); song.className = 'jp-review-song'; song.textContent = `曲名：${review.songTitle}`; card.append(song);
        }
        const meta = document.createElement('span');
        const date = typeof review.publishedAt === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(review.publishedAt) ? review.publishedAt.slice(0,10).replaceAll('-','.') : '';
        const orderCount = Number.isInteger(review.orderCount) && review.orderCount >= 1 && review.orderCount <= 5 ? review.orderCount : 1;
        const repeatLabel = orderCount === 5 ? '5回以上のご依頼' : orderCount > 1 ? `${orderCount}回目のご依頼` : '';
        meta.textContent = [review.displayName, repeatLabel, date].filter(Boolean).join(' · ');
        card.append(meta); cards.push(card);
      }
      list.replaceChildren(...cards);
      approved.hidden = cards.length === 0;
      const approvedCount = Number.isInteger(payload?.summary?.approved) ? payload.summary.approved : cards.length;
      document.dispatchEvent(new CustomEvent('lian:reviews-updated',{detail:{approved:approvedCount}}));
    } catch { /* An unavailable reviews service must not hide existing reviews. */ }
    finally { loading = false; }
  }
  if (reviewsPanel) new MutationObserver(loadApproved).observe(reviewsPanel, { attributes: true, attributeFilter: ['hidden'] });
  document.addEventListener('visibilitychange', loadApproved);
  setInterval(loadApproved, 60_000);
  loadApproved();

  // The supported Tawk API temporarily removes the minimized launcher while the
  // mobile form is in view. No iframe contents, styles, or dashboard are touched.
  const wrap = document.querySelector('#contact-form-wrap');
  let hiddenByForm = false, chatRequested = false, scheduled = false;
  const bound = new WeakSet();
  function applyLauncher() {
    scheduled = false;
    const api = window.Tawk_API;
    if (!api || typeof api.hideWidget !== 'function' || typeof api.showWidget !== 'function') return;
    if (!bound.has(api)) {
      bound.add(api);
      const previous = api.onChatMinimized;
      api.onChatMinimized = function (...args) { if (typeof previous === 'function') previous.apply(this, args); chatRequested = false; scheduleLauncher(); };
    }
    if (chatRequested || (typeof api.isChatMaximized === 'function' && api.isChatMaximized())) return;
    const rect = wrap?.getBoundingClientRect();
    const shouldHide = innerWidth <= 700 && wrap && !wrap.hidden && rect.top < innerHeight && rect.bottom > 66;
    if (shouldHide && !hiddenByForm) { api.hideWidget(); hiddenByForm = true; }
    else if (!shouldHide && hiddenByForm) { api.showWidget(); hiddenByForm = false; }
  }
  function scheduleLauncher() { if (!scheduled) { scheduled = true; requestAnimationFrame(applyLauncher); } }
  document.addEventListener('click', event => {
    if (!event.target.closest?.('[data-open-livechat]')) return;
    const api = window.Tawk_API;
    if (typeof api?.maximize === 'function') { api.showWidget?.(); hiddenByForm = false; chatRequested = true; }
  }, true);
  addEventListener('scroll', scheduleLauncher, { passive: true });
  addEventListener('resize', scheduleLauncher);
  addEventListener('focusin', scheduleLauncher);
  if (wrap) new MutationObserver(scheduleLauncher).observe(wrap, { attributes: true, attributeFilter: ['hidden'] });
  const api = window.Tawk_API = window.Tawk_API || {};
  const previousLoad = api.onLoad;
  api.onLoad = function (...args) { if (typeof previousLoad === 'function') previousLoad.apply(this, args); scheduleLauncher(); };
  const readyTimer = setInterval(() => { scheduleLauncher(); if (typeof window.Tawk_API?.hideWidget === 'function') clearInterval(readyTimer); }, 1000);
  scheduleLauncher();
});
