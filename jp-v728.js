document.addEventListener('DOMContentLoaded', () => {
  if (!document.body.classList.contains('v728-linear')) return;

  // In the linear layout every main section stays available in document order.
  document.querySelectorAll('[data-jp-panel]').forEach(section => {
    section.hidden = false;
    section.classList.add('is-active');
    section.removeAttribute('role');
    section.removeAttribute('aria-labelledby');
  });

  // Keep the compact desktop/mobile header understandable while scrolling.
  const links = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && links.length && sections.length) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`));
    }, { rootMargin: '-25% 0px -60% 0px', threshold: [0,.2,.5] });
    sections.forEach(section => observer.observe(section));
  }

  // Small-screen accordions stay compact: open one guide detail at a time.
  const compact = matchMedia('(max-width: 760px)');
  const guideDetails = [...document.querySelectorAll('.v728-guide-details details')];
  guideDetails.forEach(item => item.addEventListener('toggle', () => {
    if (!compact.matches || !item.open) return;
    guideDetails.forEach(other => { if (other !== item) other.open = false; });
  }));
});
