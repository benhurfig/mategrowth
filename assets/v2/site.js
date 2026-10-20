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
  const storage = {
    get(key) { try { return window.localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { window.localStorage.setItem(key, value); } catch { /* Session-only choice still works. */ } }
  };
  const consentKey = 'mategrowth_corporate_analytics_v2';
  let consentChoice = storage.get(consentKey);
  let analyticsLoaded = false;
  const gaValid = /^G-[A-Z0-9]+$/.test(cfg.analyticsId || '');
  const prodHost = /^(www\.)?mategrowth\.com$/.test(location.hostname);
  const safeReferrer = () => {
    try { return document.referrer ? new URL(document.referrer).origin + '/' : ''; }
    catch { return ''; }
  };
  const track = (event, extra = {}) => {
    if (consentChoice !== 'granted' || !analyticsLoaded || typeof window.gtag !== 'function') return;
    window.gtag('event', event, {
      page_type: cfg.page,
      page_language: cfg.language,
      ...extra
    });
  };
  function loadAnalytics() {
    // Preview builds on localhost never call Google Analytics.
    if (analyticsLoaded || consentChoice !== 'granted' || !gaValid || !prodHost) return;
    analyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window['ga-disable-' + cfg.analyticsId] = false;
    window.gtag('consent', 'default', {
      analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', cfg.analyticsId, {
      send_page_view: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: location.origin + location.pathname,
      page_referrer: safeReferrer(),
      page_title: document.title
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.analyticsId);
    document.head.appendChild(script);
  }
  const consentPanel = qs('[data-consent]');
  let consentReturnFocus = null;
  const showConsent = (focus = false) => {
    if (!consentPanel) return;
    consentPanel.hidden = false;
    if (focus) { consentReturnFocus = document.activeElement; qs('button', consentPanel)?.focus(); }
  };
  if (consentChoice === 'granted') loadAnalytics();
  if (!['granted', 'denied'].includes(consentChoice)) showConsent();
  qsa('[data-open-consent]').forEach(button => button.addEventListener('click', () => showConsent(true)));
  qsa('[data-consent-choice]').forEach(button => button.addEventListener('click', () => {
    const oldChoice = consentChoice;
    consentChoice = button.dataset.consentChoice;
    storage.set(consentKey, consentChoice);
    consentPanel.hidden = true;
    announce(cfg.consent_status);
    if (consentReturnFocus) { consentReturnFocus.focus(); consentReturnFocus = null; }
    if (consentChoice === 'granted') loadAnalytics();
    if (oldChoice === 'granted' && consentChoice === 'denied') {
      window['ga-disable-' + cfg.analyticsId] = true;
      window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
      // Remove known first-party GA cookies where this page can access them.
      const names = document.cookie.split(';').map(x => x.trim().split('=')[0]).filter(x => /^_ga($|_)/.test(x));
      names.forEach(name => {
        ['', location.hostname, '.' + location.hostname, 'mategrowth.com', '.mategrowth.com'].forEach(domain => {
          document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax' + (domain ? '; domain=' + domain : '');
        });
      });
      // A reload unloads all already-loaded analytics scripts.
      location.reload();
    }
  }));
  document.addEventListener('click', (event) => {
    const el = event.target.closest('[data-track]');
    if (!el) return;
    // Never collect a full URL, the user's message, or arbitrary dataset fields.
    const params = {};
    ['source', 'channel', 'language', 'project'].forEach(key => {
      if (el.dataset[key]) params[key] = el.dataset[key].slice(0, 80);
    });
    track(el.dataset.track, params);
  });
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
      track('mobile_menu_open');
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
      track('contact_channel_click', { channel, source: 'contact_summary' });
      // Keep personal message content out of DOM href attributes and link-click analytics.
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
      // Preparation is not a lead conversion or a sent message.
      track('contact_brief_ready', { service_interest: read('need'), business_type: read('type') });
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
