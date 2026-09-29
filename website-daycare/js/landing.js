/* Scoped UI: progressive enhancement. No trackers or third-party dependencies. */
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const analytics = (name, values) => window.MGAnalytics?.track(name, values);
  const tablist = document.querySelector('.feature-tabs');
  const tabs = [...document.querySelectorAll('[data-feature]')];
  function activateTab(tab, track = true) {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(item.getAttribute('aria-controls'));
      if (panel) panel.hidden = !selected;
    });
    if (track) analytics('showcase_tab_click', { feature: tab.dataset.feature, cta_location: 'inside' });
  }
  tabs.forEach(tab => tab.addEventListener('click', () => activateTab(tab)));
  tablist?.addEventListener('keydown', event => {
    const index = tabs.indexOf(document.activeElement);
    if (index === -1) return;
    let next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    activateTab(tabs[next]);
    tabs[next].focus();
  });
  document.querySelectorAll('[data-faq-id]').forEach(detail => {
    detail.addEventListener('toggle', () => {
      if (detail.open) analytics('faq_open', { faq_id: detail.dataset.faqId });
    });
  });
  // Open the targeted FAQ before native anchor navigation; also support direct links.
  function revealFaq(hash) {
    let id;
    try { id = decodeURIComponent((hash || '').replace(/^#/, '')); } catch (_) { return null; }
    if (!id) return null;
    const detail = document.getElementById(id);
    if (!detail || !detail.matches('.faq-item[data-faq-id]')) return null;
    detail.open = true;
    return detail;
  }
  document.querySelectorAll('a[data-faq-target]').forEach(link => {
    link.addEventListener('click', () => {
      const detail = revealFaq(link.hash);
      // Do not cancel the link: the URL hash and browser history stay native.
      if (detail) requestAnimationFrame(() => detail.querySelector('summary')?.focus({ preventScroll: true }));
    });
  });
  function openFaqFromLocation() {
    const detail = revealFaq(window.location.hash);
    if (detail) requestAnimationFrame(() => {
      detail.scrollIntoView({ block: 'start' });
      detail.querySelector('summary')?.focus({ preventScroll: true });
    });
  }
  window.addEventListener('hashchange', openFaqFromLocation);
  openFaqFromLocation();
  const sticky = document.querySelector('.sticky-contact');
  const pricingTitle = document.getElementById('pricing-title');
  const contact = document.getElementById('contato');
  const cookie = document.querySelector('.cookie-banner');
  let queued = false;
  function updateSticky() {
    queued = false;
    if (!sticky || !pricingTitle || !contact) return;
    const reachedPrices = pricingTitle.getBoundingClientRect().top < window.innerHeight * .65;
    const finalVisible = contact.getBoundingClientRect().top < window.innerHeight;
    const preferencesOpen = cookie && !cookie.hidden;
    sticky.hidden = !reachedPrices || finalVisible || preferencesOpen;
  }
  function queueSticky() {
    if (!queued) { queued = true; requestAnimationFrame(updateSticky); }
  }
  window.addEventListener('scroll', queueSticky, { passive: true });
  window.addEventListener('resize', queueSticky, { passive: true });
  document.addEventListener('mg:consent', queueSticky);
  document.addEventListener('mg:consent-panel', queueSticky);
  updateSticky();
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = String(new Date().getFullYear()));
})();
