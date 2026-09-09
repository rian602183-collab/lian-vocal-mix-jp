
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
    }));
  }

  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
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
      const count = Math.max(parseInt(groupCount?.value || '3', 10), 3);
      if (groupCount) groupCount.value = count;
      peopleExtra = 3500 + (count - 2) * 2000;
      peopleText = `${count}人 +${yen(peopleExtra)}〜`;
      variable = true;
    }
    if (groupWrap) groupWrap.classList.toggle('is-hidden', people !== 'group');

    const extras = [];
    let extrasPrice = 0;
    let extrasVariable = false;

    const trackCount = Math.max(parseInt(extraTrackCount?.value || '0', 10), 0);
    if (extraTrackCount) extraTrackCount.value = trackCount;
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
      if (mailTotal) mailTotal.value = 'プランを選択してください';
      return;
    }

    const subtotal = plan.price + peopleExtra + extrasPrice;
    const total = Math.round(subtotal * (1 + rushMultiplier));
    const text = yen(total) + (variable ? '〜' : '');
    outTotal.textContent = text;
    if (mailTotal) mailTotal.value = text;
  }

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
// JP V3 — click navigation / selected state
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const mainTabs = [...document.querySelectorAll('.jp-click-tab')];
  const mainPanels = [...document.querySelectorAll('[data-jp-panel]')];
  const clickNav = document.querySelector('.jp-click-nav-wrap');

  function showMainPanel(name, doScroll = true) {
    mainTabs.forEach(tab => {
      const on = tab.dataset.panelTarget === name;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', String(on));
    });
    mainPanels.forEach(panel => {
      const on = panel.dataset.jpPanel === name;
      panel.hidden = !on;
      panel.classList.toggle('is-active', on);
    });
    if (doScroll && clickNav) {
      const top = clickNav.getBoundingClientRect().bottom + window.scrollY + 3;
      window.scrollTo({top, behavior:'smooth'});
    }
  }

  mainTabs.forEach(tab => tab.addEventListener('click', () => showMainPanel(tab.dataset.panelTarget)));

  // Header and in-page links activate the same panels instead of exposing every section vertically.
  document.querySelectorAll('a[href="#works"],a[href="#price"],a[href="#guide"],a[href="#contact"]').forEach(link => {
    link.addEventListener('click', event => {
      const name = link.getAttribute('href').slice(1);
      event.preventDefault();
      showMainPanel(name);
    });
  });

  const workTabs = [...document.querySelectorAll('[data-work-filter]')];
  const workCards = [...document.querySelectorAll('[data-work-type]')];
  workTabs.forEach(tab => tab.addEventListener('click', () => {
    const type = tab.dataset.workFilter;
    workTabs.forEach(t => {
      const on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
    });
    workCards.forEach(card => card.classList.toggle('is-visible', card.dataset.workType === type));
  }));

  const priceTabs = [...document.querySelectorAll('[data-price-filter]')];
  const priceCards = [...document.querySelectorAll('[data-price-type]')];
  priceTabs.forEach(tab => tab.addEventListener('click', () => {
    const type = tab.dataset.priceFilter;
    priceTabs.forEach(t => {
      const on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
    });
    priceCards.forEach(card => card.classList.toggle('is-visible', card.dataset.priceType === type));
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

  const formToggle = document.querySelector('[data-toggle-form]');
  const formWrap = document.querySelector('.jp-contact-form-wrap');
  if (formToggle && formWrap) {
    formToggle.addEventListener('click', () => {
      const open = formWrap.hidden;
      formWrap.hidden = !open;
      formToggle.classList.toggle('is-open', open);
      formToggle.setAttribute('aria-expanded', String(open));
      const small = formToggle.querySelector('small');
      if (small) small.textContent = open ? 'もう一度クリックすると閉じます' : 'クリックすると入力フォームが開きます';
      if (open) setTimeout(() => formWrap.scrollIntoView({behavior:'smooth',block:'start'}), 60);
    });
  }
});


// JP V5 — open Tawk.to from custom site buttons.
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-open-livechat]').forEach(button => {
    button.addEventListener('click', () => {
      if (window.Tawk_API && typeof window.Tawk_API.maximize === 'function') { window.Tawk_API.maximize(); return; }
      let tries=0; const timer=setInterval(()=>{ tries++; if(window.Tawk_API && typeof window.Tawk_API.maximize==='function'){clearInterval(timer);window.Tawk_API.maximize();}else if(tries>=20){clearInterval(timer);}},250);
    });
  });
});
