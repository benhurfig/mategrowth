/* GA4 only. No Meta Pixel. Basic consent: no Google tag before acceptance.
 * whatsapp_click measures an outbound click, NOT a confirmed lead/message/sale.
 * Use ?analytics_test=1 for a network-free local audit; ?ga_debug=1 for GA4 DebugView.
 */
(() => {
  'use strict';
  const ID = document.body.dataset.gaId;
  const CONSENT_KEY = 'mg_website_analytics_consent_v1';
  const CAMPAIGN_KEY = 'mg_website_campaign_v1';
  const PAGE_TYPE = 'website_daycare';
  const params = new URLSearchParams(window.location.search);
  const testMode = params.get('analytics_test') === '1' || document.body.dataset.analyticsTest === '1';
  const debug = testMode || params.get('ga_debug') === '1';
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const eventNames = new Set(['cta_click', 'whatsapp_click', 'plan_select', 'portfolio_click', 'showcase_tab_click', 'section_view', 'pricing_view', 'scroll_depth', 'faq_open']);
  const allowedParams = new Set(['cta_location', 'plan', 'project', 'feature', 'section_name', 'percent', 'faq_id', 'plan_price']);
  const prices = Object.freeze({ essencial: 199, profissional: 399, local_growth: 599 });
  const testEvents = [];
  let consent = 'unknown';
  let initialized = false;
  let pageViewSent = false;
  let observing = false;
  let observer = null;
  let campaign = {};
  let scrollQueued = false;
  const sectionsSeen = new Set();
  const scrollSeen = new Set();
  const banner = document.querySelector('.cookie-banner');
  const safeValue = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value) ? value : '';
  function storageGet(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function storageSet(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* Private/storage-blocked mode remains usable. */ } }
  function currentCampaign() {
    const clean = {};
    utmKeys.forEach(key => { const v = safeValue(params.get(key)); if (v) clean[key] = v; });
    return clean;
  }
  function safePageUrl() {
    // Never forward arbitrary query strings, form fields, WhatsApp text or hash.
    const base = `${location.origin}${location.pathname}`;
    const clean = new URLSearchParams(currentCampaign()).toString();
    return base + (clean ? `?${clean}` : '');
  }
  function safeReferrer() {
    try { return document.referrer ? new URL(document.referrer).origin + '/' : ''; } catch (_) { return ''; }
  }
  function getCampaign() {
    const current = currentCampaign();
    try {
      if (Object.keys(current).length) {
        sessionStorage.setItem(CAMPAIGN_KEY, JSON.stringify(current));
        return current;
      }
      const previous = JSON.parse(sessionStorage.getItem(CAMPAIGN_KEY) || '{}');
      const clean = {};
      utmKeys.forEach(k => { if (safeValue(previous[k])) clean[k] = previous[k]; });
      return clean;
    } catch (_) { return current; }
  }
  function record(name, values) {
    if (debug) {
      const item = { event: name, parameters: { ...values } };
      testEvents.push(item);
      console.info('[MateGrowth GA4]', name, values);
    }
  }
  function send(name, values) {
    const payload = {
      page_type: PAGE_TYPE,
      page_language: 'pt-BR',
      product: 'website_para_daycare',
      ...values,
      send_to: ID
    };
    if (debug) payload.debug_mode = true;
    record(name, payload);
    if (!testMode && typeof window.gtag === 'function') window.gtag('event', name, payload);
  }
  function track(name, values = {}) {
    if (consent !== 'granted' || !initialized || !eventNames.has(name)) return false;
    const clean = {};
    Object.entries(values).forEach(([key, value]) => {
      if (!allowedParams.has(key)) return;
      if (typeof value === 'number' && Number.isFinite(value)) clean[key] = value;
      else if (safeValue(value)) clean[key] = value;
    });
    // Only campaign codes, never personal names/email/telephone/message strings.
    if (campaign.utm_campaign) clean.campaign_name = campaign.utm_campaign;
    if (campaign.utm_content) clean.creative_name = campaign.utm_content;
    send(name, clean);
    return true;
  }
  function clearAnalyticsCookies() {
    let names = [];
    try { names = document.cookie.split(';').map(v => v.split('=')[0].trim()).filter(n => n === '_ga' || n.startsWith('_ga_')); } catch (_) { /* Sandboxed previews may forbid cookie access. */ }
    const domains = [null, location.hostname, '.' + location.hostname];
    if (location.hostname === 'mategrowth.com' || location.hostname.endsWith('.mategrowth.com')) domains.push('.mategrowth.com');
    names.forEach(name => domains.forEach(domain => {
      try { document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax${domain ? '; domain=' + domain : ''}`; } catch (_) { /* Storage can be disabled by the browser. */ }
    }));
    try { sessionStorage.removeItem(CAMPAIGN_KEY); } catch (_) { /* optional attribution cache */ }
  }
  function initialize() {
    if (!ID || !/^G-[A-Z0-9]+$/.test(ID) || consent !== 'granted') return;
    campaign = getCampaign();
    window[`ga-disable-${ID}`] = false;
    if (!initialized) {
      if (!testMode) {
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function() { window.dataLayer.push(arguments); };
        window.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
        window.gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
        window.gtag('js', new Date());
        window.gtag('config', ID, {
          send_page_view: false,
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
          page_location: safePageUrl(),
          page_referrer: safeReferrer(),
          debug_mode: debug
        });
        if (!document.getElementById('mg-ga-script')) {
          const script = document.createElement('script');
          script.async = true;
          script.id = 'mg-ga-script';
          script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ID)}`;
          document.head.appendChild(script);
        }
      }
      initialized = true;
    } else if (!testMode && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    }
    if (!pageViewSent) {
      send('page_view', { page_title: document.title, page_location: safePageUrl(), page_referrer: safeReferrer() });
      pageViewSent = true;
    }
    startObservers();
  }
  function consentChanged(choice) {
    consent = choice;
    storageSet(CONSENT_KEY, JSON.stringify({ choice, updated_at: new Date().toISOString() }));
    if (banner) banner.hidden = true;
    if (choice === 'granted') initialize();
    else {
      window[`ga-disable-${ID}`] = true;
      if (initialized && !testMode && typeof window.gtag === 'function') {
        window.gtag('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
      }
      if (observer) observer.disconnect();
      observing = false;
      clearAnalyticsCookies();
    }
    document.dispatchEvent(new CustomEvent('mg:consent', { detail: { choice } }));
  }
  function startObservers() {
    if (observing || consent !== 'granted') return;
    observing = true;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting || consent !== 'granted') return;
          const key = entry.target.dataset.observe;
          if (!safeValue(key) || sectionsSeen.has(key)) return;
          if (track('section_view', { section_name: key })) {
            sectionsSeen.add(key);
            if (key === 'pricing') track('pricing_view', { section_name: key });
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.65 });
      document.querySelectorAll('[data-observe]').forEach(el => observer.observe(el));
    }
    trackScroll();
  }
  function trackScroll() {
    scrollQueued = false;
    if (consent !== 'granted') return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    const depth = Math.floor(window.scrollY / max * 100);
    [25, 50, 75, 90].forEach(mark => {
      if (depth >= mark && !scrollSeen.has(mark) && track('scroll_depth', { percent: mark })) scrollSeen.add(mark);
    });
  }
  document.addEventListener('click', event => {
    const el = event.target.closest?.('[data-track]');
    if (!el) return;
    const payload = { cta_location: el.dataset.ctaLocation || 'unknown' };
    if (el.dataset.plan) payload.plan = el.dataset.plan;
    if (el.dataset.project) payload.project = el.dataset.project;
    if (el.dataset.track === 'whatsapp_click' && prices[el.dataset.plan]) {
      payload.plan_price = prices[el.dataset.plan];
      track('plan_select', payload);
    }
    track(el.dataset.track, payload);
    // Do not preventDefault or delay the WhatsApp/navigation action for analytics.
  });
  document.querySelectorAll('[data-consent]').forEach(button => button.addEventListener('click', () => consentChanged(button.dataset.consent)));
  document.querySelectorAll('[data-consent-settings]').forEach(button => button.addEventListener('click', () => {
    if (banner) { banner.hidden = false; banner.querySelector('button')?.focus(); }
    document.dispatchEvent(new CustomEvent('mg:consent-panel'));
  }));
  window.addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(trackScroll); }
  }, { passive: true });
  window.MGAnalytics = Object.freeze({ track, testEvents, testMode, getConsent: () => consent, safePageUrl });
  try {
    const stored = JSON.parse(storageGet(CONSENT_KEY) || 'null');
    if (stored && ['granted', 'denied'].includes(stored.choice)) consent = stored.choice;
  } catch (_) { consent = 'unknown'; }
  if (banner) banner.hidden = consent !== 'unknown';
  if (consent === 'granted') initialize();
})();
