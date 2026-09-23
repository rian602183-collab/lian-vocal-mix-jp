import { renderPortfolio, validateManifest, heroWork } from './portfolio-view.mjs';

const root = document.getElementById('portfolio-v727');
if (root) {
  // Capture also handles players created after jp.js's initial DOM snapshot, including the hero.
  document.addEventListener('play', event => {
    if (!(event.target instanceof HTMLAudioElement)) return;
    document.querySelectorAll('audio').forEach(audio => {
      if (audio !== event.target && !audio.paused) audio.pause();
    });
  }, true);

  const pauseWithin = container => container.querySelectorAll('audio').forEach(audio => {
    if (!audio.paused) audio.pause();
  });
  const mobile = window.matchMedia('(max-width: 700px)');
  let expanded = false;
  let userInteracted = false;
  const updateWorks = () => {
    const grid = root.querySelector('[data-work-grid]');
    if (!grid) return;
    const limit = Number(mobile.matches ? grid.dataset.mobileCount : grid.dataset.desktopCount);
    const cards = [...grid.querySelectorAll('[data-work]')];
    cards.forEach((card, index) => {
      card.hidden = !expanded && index >= limit;
      if (card.hidden) pauseWithin(card);
    });
    const more = root.querySelector('[data-more]');
    more.hidden = cards.length <= limit;
    more.setAttribute('aria-expanded', String(expanded));
    more.innerHTML = expanded ? '閉じる <span aria-hidden="true">−</span>' : 'もっと見る <span aria-hidden="true">＋</span>';
  };
  const selectTab = (name, moveFocus = false) => {
    root.querySelectorAll('[data-demo-panel]').forEach(panel => {
      panel.hidden = panel.dataset.demoPanel !== name;
      panel.classList.toggle('is-active', !panel.hidden);
      if (panel.hidden) pauseWithin(panel);
    });
    root.querySelectorAll('[data-demo-tab]').forEach(button => {
      const active = button.dataset.demoTab === name;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      button.classList.toggle('is-active', active);
      if (active && moveFocus) button.focus();
    });
  };
  const enhance = () => {
    root.querySelector('.lian-demo-tabs').hidden = false;
    selectTab('ba');
    updateWorks();
  };
  root.addEventListener('click', event => {
    const tab = event.target.closest('[data-demo-tab]');
    const more = event.target.closest('[data-more]');
    if (tab) { userInteracted = true; selectTab(tab.dataset.demoTab); }
    if (more) { userInteracted = true; expanded = !expanded; updateWorks(); }
  });
  root.addEventListener('keydown', event => {
    const tab = event.target.closest('[data-demo-tab]');
    if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const tabs = [...root.querySelectorAll('[data-demo-tab]')];
    const index = tabs.indexOf(tab);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    userInteracted = true;
    selectTab(tabs[next].dataset.demoTab, true);
  });
  document.addEventListener('play', () => { userInteracted = true; }, true);
  mobile.addEventListener('change', updateWorks);
  enhance();

  // Static generated markup stays usable offline / if the manifest request fails.
  // Do not replace audio controls once the visitor has started using them.
  fetch(new URL('./portfolio-manifest.json', import.meta.url), { cache: 'no-cache' })
    .then(response => { if (!response.ok) throw new Error('Manifest unavailable'); return response.json(); })
    .then(data => {
      validateManifest(data);
      if (userInteracted) { root.dataset.manifestStatus = 'static-in-use'; return; }
      root.innerHTML = renderPortfolio(data);
      const hero = heroWork(data);
      const title = document.querySelector('[data-portfolio-hero-title]');
      const audio = document.querySelector('[data-portfolio-hero-audio]');
      if (title) title.textContent = hero.title;
      if (audio) {
        if (audio.getAttribute('src') !== hero.audio) audio.setAttribute('src', hero.audio);
        audio.preload = 'none';
        audio.setAttribute('aria-label', hero.title + ' · LIAN’S SOUND');
      }
      enhance();
      root.dataset.manifestStatus = 'loaded';
    })
    .catch(() => { root.dataset.manifestStatus = 'static-fallback'; });
}
