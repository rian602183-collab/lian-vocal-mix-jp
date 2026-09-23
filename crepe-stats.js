(() => {
  'use strict';
  const crepeEndpoint = '/.netlify/functions/crepe-stats';
  const siteReviewsEndpoint = '/.netlify/functions/reviews-public';
  const intervalMs = 5 * 60 * 1000;
  const minVisibilityRefreshMs = 60 * 1000;
  const requestTimeoutMs = 12 * 1000;
  const section = document.querySelector('.jp-quick-strip');
  const nodes = {
    works: document.querySelector('[data-crepe-stat="works"]'),
    reviewTotal: document.querySelector('[data-review-stat="total"]'),
    average: document.querySelector('[data-crepe-stat="avgDays"]'),
    breakdown: document.querySelector('[data-review-breakdown]'),
    reviewSummary: document.querySelector('[data-review-source-summary]'),
  };
  if (!section || !nodes.works || !nodes.reviewTotal || !nodes.average) return;

  const unitSuffix = Object.freeze({minute:'分',hour:'時間',day:'日',week:'週間'});
  let busy = false;
  let lastRequestAt = 0;
  let timer = null;
  let lastCrepeReviews = 9;
  let lastSiteReviews = 0;

  function validCount(value) {
    return Number.isInteger(value) && value >= 0 && value <= 100000;
  }

  function averageLabel(data) {
    const value = Number(data.avgValue);
    const unit = String(data.avgUnit || '');
    if (Number.isInteger(value) && value >= 1 && value <= 100000 && unitSuffix[unit]) return `${value}${unitSuffix[unit]}`;
    const days = Number(data.avgDays);
    if (Number.isInteger(days) && days >= 1 && days <= 366) return `${days}日`;
    return null;
  }

  async function fetchJson(url, controller) {
    const res = await fetch(url,{
      method:'GET',
      headers:{accept:'application/json'},
      cache:'no-store',
      credentials:'same-origin',
      signal:controller.signal,
    });
    if (!res.ok) throw new Error('HTTP_' + res.status);
    const data = await res.json();
    if (!data || typeof data !== 'object') throw new Error('INVALID_JSON');
    return data;
  }

  function siteReviewCount(payload) {
    const summary = Number(payload?.summary?.approved);
    if (validCount(summary)) return summary;
    if (!Array.isArray(payload?.reviews)) return null;
    let count = 0;
    for (const review of payload.reviews) {
      if (!review || typeof review !== 'object') continue;
      if (typeof review.displayName !== 'string' || typeof review.body !== 'string') continue;
      if (!Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5) continue;
      count += 1;
    }
    return validCount(count) ? count : null;
  }

  function renderReviewCounts(crepeReviews, siteReviews) {
    const total = crepeReviews + siteReviews;
    if (!validCount(total)) return;
    nodes.reviewTotal.textContent = `${total}件`;
    if (nodes.breakdown) nodes.breakdown.textContent = `CREPE ${crepeReviews}件 + サイト ${siteReviews}件`;
    if (nodes.reviewSummary) nodes.reviewSummary.textContent = `CREPE ${crepeReviews}件 · サイト ${siteReviews}件 · 合計 ${total}件`;
    section.dataset.reviewCrepe = String(crepeReviews);
    section.dataset.reviewSite = String(siteReviews);
    section.dataset.reviewTotal = String(total);
  }

  async function update() {
    if (busy) return;
    busy = true;
    lastRequestAt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(),requestTimeoutMs);
    try {
      const results = await Promise.allSettled([
        fetchJson(crepeEndpoint,controller),
        fetchJson(siteReviewsEndpoint,controller),
      ]);

      if (results[0].status === 'fulfilled') {
        const data = results[0].value;
        const works = Number(data.works);
        const crepeReviews = Number(data.reviews);
        const average = averageLabel(data);
        if (validCount(works) && validCount(crepeReviews) && crepeReviews <= works && average) {
          nodes.works.textContent = `${works}件`;
          nodes.average.textContent = average;
          lastCrepeReviews = crepeReviews;
          section.dataset.crepeStats = data.fallback ? 'fallback' : (data.stale ? 'cached' : 'current');
          section.dataset.crepeSchema = String(data.schemaVersion || 1);
        }
      }

      if (results[1].status === 'fulfilled') {
        const count = siteReviewCount(results[1].value);
        if (count !== null) lastSiteReviews = count;
      }

      renderReviewCounts(lastCrepeReviews,lastSiteReviews);
      section.dataset.reviewStats = results.every(item => item.status === 'fulfilled') ? 'current' : 'partial';
    } catch {
      renderReviewCounts(lastCrepeReviews,lastSiteReviews);
    } finally {
      clearTimeout(timeout);
      busy = false;
    }
  }

  function scheduleNext() {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      await update();
      scheduleNext();
    },intervalMs);
  }

  renderReviewCounts(lastCrepeReviews,lastSiteReviews);
  update().finally(scheduleNext);
  document.addEventListener('visibilitychange',() => {
    if (!document.hidden && Date.now() - lastRequestAt >= minVisibilityRefreshMs) update();
  });
  document.addEventListener('lian:reviews-updated',event => {
    const count = Number(event?.detail?.approved);
    if (validCount(count)) {
      lastSiteReviews = count;
      renderReviewCounts(lastCrepeReviews,lastSiteReviews);
    } else {
      update();
    }
  });
})();
