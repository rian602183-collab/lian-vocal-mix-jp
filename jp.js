
document.addEventListener('DOMContentLoaded', () => {
  const mobileBtn = document.querySelector('[data-mobile-menu]');
  const links = document.querySelector('.nav-links');
  if (mobileBtn && links) {
    mobileBtn.addEventListener('click', () => {
      const open = links.classList.toggle('mobile-open');
      mobileBtn.classList.toggle('is-open', open);
      mobileBtn.setAttribute('aria-expanded', String(open));
      mobileBtn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      links.classList.remove('mobile-open');
      mobileBtn.classList.remove('is-open');
      mobileBtn.setAttribute('aria-expanded', 'false');
      mobileBtn.setAttribute('aria-label', 'メニューを開く');
    }));
  }

  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  const form = document.querySelector('#contact-form');
  if (!form) return;

  const yen = n => '¥' + new Intl.NumberFormat('ja-JP').format(n);
  const planSelect = document.querySelector('#plan-select');
  const peopleSelect = document.querySelector('#people-select');
  const groupWrap = document.querySelector('#group-count-wrap');
  const groupCount = document.querySelector('#group-count');
  const extraTrackCount = document.querySelector('#extra-track-count');
  const extraHarmony = document.querySelector('#extra-harmony');
  const extraAdlib = document.querySelector('#extra-adlib');
  const extraPrivate = document.querySelector('#extra-private');
  const rushSelect = document.querySelector('#rush-select');
  const deadlineInput = document.querySelector('#deadline-input');

  const outPlan = document.querySelector('#summary-plan');
  const outPeople = document.querySelector('#summary-people');
  const outExtra = document.querySelector('#summary-extra');
  const outRush = document.querySelector('#summary-rush');
  const outTotal = document.querySelector('#summary-total');
  const compactTotals = [...document.querySelectorAll('[data-estimate-total]')];

  const mailPlan = document.querySelector('#mail-estimate-plan');
  const mailPeople = document.querySelector('#mail-estimate-people');
  const mailExtra = document.querySelector('#mail-estimate-extra');
  const mailRush = document.querySelector('#mail-estimate-rush');
  const mailTotal = document.querySelector('#mail-estimate-total');

  const planMap = {
    consult: { label: '相談後に決定', price: null, variable: true },
    light: { label: 'LIGHT', price: 4000, variable: false },
    standard: { label: 'STANDARD', price: 5500, variable: false },
    deluxe: { label: 'DELUXE', price: 6500, variable: true }
  };

  if (deadlineInput) {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    deadlineInput.min = local.toISOString().slice(0, 10);
  }

  const extraRoot = document.querySelector('#extra-work-select');
  const extraTitle = document.querySelector('#extra-work-trigger-text');
  const extraRows = extraRoot ? [...extraRoot.querySelectorAll('.jp-extra-option')] : [];

  // Keep partially typed values intact. Normalize only after editing is committed.
  function countForEstimate(input, minimum) {
    const value = Number(input?.value);
    return Number.isSafeInteger(value) && value >= minimum ? value : minimum;
  }

  function syncExtrasUi() {
    const selected = extraRows.filter(row => row.querySelector('input')?.checked);
    extraRows.forEach(row => {
      const input = row.querySelector('input');
      const state = row.querySelector('em');
      const checked = Boolean(input?.checked);
      row.classList.toggle('is-selected', checked);
      if (state) state.textContent = checked ? '選択済み' : '選択';
    });
    if (extraTitle) {
      if (!selected.length) extraTitle.textContent = '追加オプションを選択';
      else if (selected.length === 1) extraTitle.textContent = selected[0].querySelector('b')?.textContent || '1件選択';
      else extraTitle.textContent = `${selected.length}件選択中`;
    }
  }

  function updateEstimate() {
    if (!planSelect || !peopleSelect || !rushSelect) return;
    const plan = planMap[planSelect.value] || planMap.consult;
    const people = peopleSelect.value;

    let variable = plan.variable;
    let peopleExtra = 0;
    let peopleText = '追加なし';

    if (people === 'duet') {
      peopleExtra = 3500;
      peopleText = '+¥3,500〜';
      variable = true;
    } else if (people === 'group') {
      const count = countForEstimate(groupCount, 3);
      peopleExtra = 3500 + (count - 2) * 2000;
      peopleText = `${count}人 +${yen(peopleExtra)}〜`;
      variable = true;
    }
    if (groupWrap) groupWrap.classList.toggle('is-hidden', people !== 'group');

    const extras = [];
    let extrasPrice = 0;
    let extrasVariable = false;

    const trackCount = countForEstimate(extraTrackCount, 0);
    if (trackCount > 0) {
      extras.push(`追加track ×${trackCount}`);
      extrasPrice += trackCount * 500;
    }
    if (extraHarmony?.checked) {
      extras.push('ハモリ・コーラス');
      extrasPrice += 1000;
      extrasVariable = true;
      variable = true;
    }
    if (extraAdlib?.checked) {
      extras.push('ダブル・アドリブ');
      extrasPrice += 1000;
      extrasVariable = true;
      variable = true;
    }
    if (extraPrivate?.checked) {
      extras.push('非公開');
      extrasPrice += 2000;
    }

    let rushMultiplier = 0;
    let rushText = 'なし';
    if (rushSelect.value === 'rush48') {
      rushMultiplier = 0.30;
      rushText = '48時間以内 (+30%)';
    } else if (rushSelect.value === 'rush24') {
      rushMultiplier = 0.50;
      rushText = '当日納品 (+50%)';
    }

    const planText = plan.price
      ? `${plan.label} · ${yen(plan.price)}${plan.variable ? '〜' : ''}`
      : '相談後に決定';

    const extraText = extras.length
      ? `${extras.join(' / ')} · +${yen(extrasPrice)}${extrasVariable ? '〜' : ''}`
      : '選択なし';

    if (outPlan) outPlan.textContent = planText;
    if (outPeople) outPeople.textContent = peopleText;
    if (outExtra) outExtra.textContent = extraText;
    if (outRush) outRush.textContent = rushText;

    if (mailPlan) mailPlan.value = planText;
    if (mailPeople) mailPeople.value = peopleText;
    if (mailExtra) mailExtra.value = extraText;
    if (mailRush) mailRush.value = rushText;

    if (!outTotal) return;
    if (plan.price === null) {
      outTotal.textContent = 'プランを選択してください';
      compactTotals.forEach(output => { output.textContent = outTotal.textContent; });
      if (mailTotal) mailTotal.value = 'プランを選択してください';
      return;
    }

    const subtotal = plan.price + peopleExtra + extrasPrice;
    const total = Math.round(subtotal * (1 + rushMultiplier));
    const text = yen(total) + (variable ? '〜' : '');
    outTotal.textContent = text;
    compactTotals.forEach(output => { output.textContent = text; });
    if (mailTotal) mailTotal.value = text;
  }

  [[groupCount, 3], [extraTrackCount, 0]].forEach(([input, minimum]) => {
    if (!input) return;
    const commitCount = () => {
      input.value = String(countForEstimate(input, minimum));
      updateEstimate();
    };
    input.addEventListener('change', commitCount);
    input.addEventListener('blur', commitCount);
  });

  [planSelect, peopleSelect, groupCount, extraTrackCount, extraHarmony, extraAdlib, extraPrivate, rushSelect]
    .filter(Boolean)
    .forEach(el => {
      el.addEventListener('input', () => { syncExtrasUi(); updateEstimate(); });
      el.addEventListener('change', () => { syncExtrasUi(); updateEstimate(); });
    });

  syncExtrasUi();
  updateEstimate();
});


// ============================================================
// JP V7 — hash navigation, panel state, audio coordination, fallbacks
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const mainTabs = [...document.querySelectorAll('.jp-click-tab')];
  const mainPanels = [...document.querySelectorAll('[data-jp-panel]')];
  const clickNav = document.querySelector('.jp-click-nav-wrap');
  const header = document.querySelector('.site-header');
  const formToggle = document.querySelector('[data-toggle-form]');
  const formWrap = document.querySelector('.jp-contact-form-wrap');
  const planSelect = document.querySelector('#plan-select');
  const chatFallback = document.querySelector('[data-chat-fallback]');

  const hashToPanel = {
    portfolio: 'works',
    works: 'works',
    price: 'price',
    guide: 'guide',
    reviews: 'reviews',
    contact: 'contact'
  };
  const panelToHash = { works: 'portfolio', price: 'price', guide: 'guide', reviews: 'reviews', contact: 'contact' };
  const validPanels = new Set(Object.values(hashToPanel));

  function panelFromHash() {
    return hashToPanel[window.location.hash.slice(1).toLowerCase()] || 'works';
  }

  function scrollToVisible(target, behavior = 'smooth') {
    if (!target) return;
    const headerHeight = header?.getBoundingClientRect().height || 0;
    const navHeight = clickNav?.getBoundingClientRect().height || 0;
    const offset = headerHeight + navHeight + 12;
    const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - offset);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : behavior;
    window.scrollTo({ top, behavior: motion });
  }

  function pauseAudios(root = document) {
    root.querySelectorAll('audio').forEach(audio => {
      if (!audio.paused) audio.pause();
    });
  }

  function syncFormButton(open) {
    if (!formToggle) return;
    formToggle.classList.toggle('is-open', open);
    formToggle.setAttribute('aria-expanded', String(open));
    const label = formToggle.querySelector('strong');
    const small = formToggle.querySelector('small');
    if (label) label.textContent = open ? 'フォームを閉じる' : 'お問い合わせフォーム';
    if (small) small.textContent = open ? 'もう一度クリックすると閉じます' : 'クリックすると入力フォームが開きます';
  }

  function setHash(name, mode) {
    const nextHash = `#${panelToHash[name] || name}`;
    if (mode === 'none' || window.location.hash === nextHash) return;
    if (mode === 'replace') history.replaceState(null, '', nextHash);
    else history.pushState(null, '', nextHash);
  }

  function showMainPanel(name, { scroll = true, historyMode = 'push' } = {}) {
    const panelName = validPanels.has(name) ? name : 'works';
    mainTabs.forEach(tab => {
      const on = tab.dataset.panelTarget === panelName;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', String(on));
      tab.setAttribute('tabindex', on ? '0' : '-1');
    });
    mainPanels.forEach(panel => {
      const on = panel.dataset.jpPanel === panelName;
      panel.hidden = !on;
      panel.classList.toggle('is-active', on);
      if (!on) pauseAudios(panel);
    });
    const activeTab = mainTabs.find(tab => tab.dataset.panelTarget === panelName);
    const tabStrip = activeTab?.parentElement;
    if (activeTab && tabStrip) {
      const box = activeTab.getBoundingClientRect();
      const stripBox = tabStrip.getBoundingClientRect();
      if (box.left < stripBox.left) tabStrip.scrollLeft -= stripBox.left - box.left;
      else if (box.right > stripBox.right) tabStrip.scrollLeft += box.right - stripBox.right;
    }
    setHash(panelName, historyMode);
    if (scroll) requestAnimationFrame(() => scrollToVisible(document.querySelector(`[data-jp-panel="${panelName}"]`)));
  }

  function setFormOpen(open, shouldScroll = false) {
    if (!formWrap) return;
    formWrap.hidden = !open;
    syncFormButton(open);
    if (open && shouldScroll) requestAnimationFrame(() => scrollToVisible(formWrap));
  }

  function openContact(plan) {
    showMainPanel('contact', { scroll: false });
    setFormOpen(true, false);
    if (plan && planSelect) {
      planSelect.value = plan;
      planSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    requestAnimationFrame(() => scrollToVisible(formWrap || document.querySelector('#contact')));
  }

  mainTabs.forEach(tab => tab.addEventListener('click', () => showMainPanel(tab.dataset.panelTarget)));
  // Keep all five tabs usable with the keyboard and in a narrow horizontal strip.
  mainTabs.forEach((tab, index) => tab.addEventListener('keydown', event => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? mainTabs.length - 1
      : (index + (event.key === 'ArrowRight' ? 1 : -1) + mainTabs.length) % mainTabs.length;
    mainTabs[next].focus({ preventScroll: true });
    showMainPanel(mainTabs[next].dataset.panelTarget);
  }));
  document.querySelectorAll('a[href="#works"],a[href="#portfolio"],a[href="#price"],a[href="#guide"],a[href="#reviews"],a[href="#contact"]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const card = link.closest('[data-price-type]');
      if (card) {
        openContact(card.dataset.priceType);
      } else {
        showMainPanel(hashToPanel[link.getAttribute('href').slice(1)] || 'works');
      }
    });
  });
  window.addEventListener('hashchange', () => showMainPanel(panelFromHash(), { historyMode: 'none' }));
  window.addEventListener('popstate', () => showMainPanel(panelFromHash(), { historyMode: 'none' }));
  showMainPanel(panelFromHash(), { scroll: Boolean(window.location.hash), historyMode: 'none' });

  const workTabs = [...document.querySelectorAll('[data-work-filter]')];
  const workCards = [...document.querySelectorAll('[data-work-type]')];
  workTabs.forEach(tab => tab.addEventListener('click', () => {
    const type = tab.dataset.workFilter;
    workTabs.forEach(t => {
      const on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
    });
    workCards.forEach(card => {
      const visible = card.dataset.workType === type;
      card.classList.toggle('is-visible', visible);
      if (!visible) pauseAudios(card);
    });
  }));

  const guideTabs = [...document.querySelectorAll('[data-guide-filter]')];
  const guideFlow = document.querySelector('[data-guide-panel="flow"]');
  const guideItems = [...document.querySelectorAll('.jp-guide-grid [data-guide-panel]')];
  const guideGrid = document.querySelector('[data-guide-grid]');
  function showGuide(type) {
    guideTabs.forEach(t => {
      const on = t.dataset.guideFilter === type;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
    });
    if (guideFlow) guideFlow.classList.toggle('is-visible', type === 'flow');
    guideItems.forEach(item => item.classList.toggle('is-visible', item.dataset.guidePanel === type));
    if (guideGrid) {
      guideGrid.classList.toggle('files-mode', type === 'files');
      guideGrid.classList.toggle('time-mode', type === 'time');
      guideGrid.style.display = type === 'flow' ? 'none' : 'grid';
    }
  }
  guideTabs.forEach(tab => tab.addEventListener('click', () => showGuide(tab.dataset.guideFilter)));
  showGuide('flow');

  if (formToggle && formWrap) formToggle.addEventListener('click', () => setFormOpen(formWrap.hidden, true));

  const allAudios = [...document.querySelectorAll('audio')];
  const beforeAudio = document.querySelector('.jp-ba-audio:not(.after) audio');
  const afterAudio = document.querySelector('.jp-ba-audio.after audio');
  allAudios.forEach(audio => audio.addEventListener('play', () => {
    allAudios.forEach(other => {
      if (other !== audio) other.pause();
    });
    const paired = audio === beforeAudio ? afterAudio : audio === afterAudio ? beforeAudio : null;
    if (paired && Number.isFinite(audio.currentTime)) {
      const max = Number.isFinite(paired.duration) ? paired.duration : audio.currentTime;
      paired.currentTime = Math.min(audio.currentTime, max);
    }
  }));

  function tawkReady() {
    return Boolean(window.Tawk_API && typeof window.Tawk_API.maximize === 'function');
  }
  function setChatFallback(visible) {
    if (chatFallback) chatFallback.hidden = !visible;
  }
  setChatFallback(false);
  let tawkChecks = 0;
  function checkTawkAvailability() {
    if (tawkReady()) {
      setChatFallback(false);
      return;
    }
    tawkChecks += 1;
    if (tawkChecks >= 20) setChatFallback(true);
    // Keep checking after the loading notice, at a lower frequency, for delayed loads.
    setTimeout(checkTawkAvailability, tawkChecks < 20 ? 500 : 2000);
  }
  setTimeout(checkTawkAvailability, 500);

  document.querySelectorAll('[data-open-livechat]').forEach(button => {
    button.addEventListener('click', () => {
      if (tawkReady()) {
        setChatFallback(false);
        window.Tawk_API.maximize();
        return;
      }
      setChatFallback(true);
    });
  });
  document.querySelectorAll('[data-fallback-contact]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    openContact();
  }));
});
