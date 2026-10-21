/* Native client-side behavior. No package installation or backend required. */
(() => {
  'use strict';
  const configNode = document.getElementById('site-config');
  if (!configNode) return;
  const cfg = JSON.parse(configNode.textContent);
  const qs = (s, p = document) => p.querySelector(s);
  const qsa = (s, p = document) => [...p.querySelectorAll(s)];
  const live = qs('[data-live]');
  const announce = (s) => { if (live) live.textContent = s; };
  const header = qs('[data-header]');
  const updateHeader = () => header?.classList.toggle('is-scrolled', scrollY > 10);
  updateHeader();
  addEventListener('scroll', updateHeader, { passive: true });
  const menuToggle = qs('.menu-toggle');
  const menu = qs('#mobile-navigation');
  function closeMenu(restoreFocus = false) {
    if (!menu || !menuToggle) return;
    menu.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.classList.remove('is-open');
    if (restoreFocus) menuToggle.focus();
  }
  menuToggle?.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') === 'true';
    if (open) closeMenu();
    else {
      menu.hidden = false;
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.classList.add('is-open');
    }
  });
  qsa('a', menu || document.createElement('div')).forEach(a => a.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu && !menu.hidden) closeMenu(true);
  });
  document.addEventListener('click', (event) => {
    if (menu && !menu.hidden && !menu.contains(event.target) && !menuToggle?.contains(event.target)) closeMenu();
  });
  matchMedia('(min-width:1021px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
  qsa('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });
  // iOS uses &body, while most other SMS handlers accept ?body.
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function smsLink(text) {
    return 'sms:' + cfg.phone + (isIOS ? '&body=' : '?body=') + encodeURIComponent(text);
  }
  qsa('[data-sms]').forEach(a => {
    const href = a.getAttribute('href');
    if (!href?.includes('?body=')) return;
    a.setAttribute('href', smsLink(decodeURIComponent(href.split('?body=')[1])));
  });
  const form = qs('#contact-form');
  if (form) {
    const result = qs('#contact-result');
    const preview = qs('#message-preview');
    let preparedLinks = null;
    qsa('[data-channel]', result).forEach(a => a.addEventListener('click', (event) => {
      if (!preparedLinks?.[a.dataset.channel]) return;
      event.preventDefault();
      event.stopPropagation();
      const channel = a.dataset.channel;
      // Keep personal message content out of DOM href attributes.
      if (channel === 'whatsapp') window.open(preparedLinks[channel], '_blank', 'noopener,noreferrer');
      else window.location.href = preparedLinks[channel];
    }));
    // Preselect only whitelisted service keys; never interpolate arbitrary URL content into the DOM.
    const selected = new URLSearchParams(location.search).get('service');
    if (['websites', 'seo', 'google', 'ads', 'systems', 'videos'].includes(selected)) form.elements.need.value = selected;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const values = new FormData(form);
      const read = key => String(values.get(key) || '').trim();
      // Native required allows whitespace, so validate meaningful business fields explicitly.
      for (const key of ['name', 'business', 'city']) {
        const field = form.elements[key];
        if (!read(key)) {
          field.setCustomValidity(cfg.form.choose);
          field.reportValidity();
          field.addEventListener('input', () => field.setCustomValidity(''), { once: true });
          return;
        }
      }
      const optionText = key => form.elements[key].selectedOptions[0]?.textContent || '';
      const lines = [
        'MateGrowth — ' + cfg.subject,
        '',
        cfg.form.name + ': ' + read('name'),
        cfg.form.business + ': ' + read('business'),
        cfg.form.city + ': ' + read('city'),
        cfg.form.type + ': ' + optionText('type'),
        cfg.form.need + ': ' + optionText('need'),
      ];
      if (read('message')) lines.push('', read('message'));
      lines.push('', 'Website MateGrowth · ' + cfg.locale);
      const text = lines.join('\n');
      preview.value = text;
      const links = {
        sms: smsLink(text),
        email: 'mailto:' + cfg.email + '?subject=' + encodeURIComponent(cfg.subject) + '&body=' + encodeURIComponent(text),
        whatsapp: 'https://wa.me/' + cfg.phone.replace(/\D/g, '') + '?text=' + encodeURIComponent(text)
      };
      preparedLinks = links;
      form.hidden = true;
      result.hidden = false;
      result.focus();
      result.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      announce(cfg.form.ready);
    });
    // Prevent native form submission if JavaScript is disabled or initialization fails.
    const protectedFields = qs('[data-needs-js]', form);
    if (protectedFields) protectedFields.disabled = false;
    qs('[data-edit-summary]')?.addEventListener('click', () => {
      result.hidden = true;
      form.hidden = false;
      form.elements.name.focus();
    });
    qs('[data-copy-summary]')?.addEventListener('click', async () => {
      try {
        if (!navigator.clipboard) throw new Error('clipboard unavailable');
        await navigator.clipboard.writeText(preview.value);
        announce(cfg.form.copied);
        const b = qs('[data-copy-summary]');
        b.textContent = cfg.form.copied;
        setTimeout(() => { b.textContent = cfg.form.copy; }, 2400);
      } catch {
        preview.focus(); preview.select(); announce(cfg.form.copy_error);
      }
    });
  }
})();
