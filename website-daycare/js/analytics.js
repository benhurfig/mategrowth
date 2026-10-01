/*
 * MateGrowth — Website para Daycare tracking
 * GA4 + optional Meta Pixel, both gated by the same explicit consent choice.
 *
 * IMPORTANT:
 * - whatsapp_click / WhatsAppClick = outbound button click, NOT a confirmed message, lead or sale.
 * - Add the numeric Meta Pixel ID to <body data-meta-pixel-id="..."> to activate Meta Pixel.
 * - Use ?analytics_test=1 for a network-free audit (no GA4 and no Meta requests).
 * - Use ?ga_debug=1 for GA4 DebugView after consent.
 */
(() => {
  'use strict';

  const GA_ID = document.body.dataset.gaId || '';
  const META_PIXEL_ID = document.body.dataset.metaPixelId || '';
  const CONSENT_KEY = 'mg_website_analytics_consent_v2';
  const LEGACY_CONSENT_KEY = 'mg_website_analytics_consent_v1'; // removed after the visitor makes a new v2 choice
  const CAMPAIGN_KEY = 'mg_website_campaign_v2';
  const PAGE_TYPE = 'website_daycare';
  const PRODUCT = 'website_para_daycare';
  const params = new URLSearchParams(window.location.search);
  const testMode = params.get('analytics_test') === '1' || document.body.dataset.analyticsTest === '1';
  const debug = testMode || params.get('ga_debug') === '1';
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const eventNames = new Set([
    'cta_click',
    'whatsapp_click',
    'plan_select',
    'portfolio_click',
    'showcase_tab_click',
    'section_view',
    'pricing_view',
    'scroll_depth',
    'faq_open'
  ]);
  const allowedParams = new Set([
    'cta_location',
    'plan',
    'project',
    'feature',
    'section_name',
    'percent',
    'faq_id',
    'plan_price'
  ]);
  const prices = Object.freeze({ essencial: 199, profissional: 399, local_growth: 599, website_care: 59 });
  const testEvents = [];
  const metaTestEvents = [];

  let consent = 'unknown';
  let gaInitialized = false;
  let metaInitialized = false;
  let pageViewSent = false;
  let metaPageViewSent = false;
  let metaViewContentSent = false;
  let observing = false;
  let observer = null;
  let campaign = {};
  let scrollQueued = false;

  const sectionsSeen = new Set();
  const scrollSeen = new Set();
  const banner = document.querySelector('.cookie-banner');

  // General event parameter values remain conservative.
  const safeValue = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value) ? value : '';

  // Campaign values can arrive from Meta macros with spaces / pipes. Normalize instead of discarding them.
  // Example: "WEBSITE PARA DAYCARE | LANDPAGE" -> "website_para_daycare_landpage".
  function campaignValue(value) {
    if (typeof value !== 'string') return '';
    const normalized = value
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_')
      .slice(0, 100);
    return safeValue(normalized);
  }

  function storageGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function storageSet(key, value) {
    try { localStorage.setItem(key, value); } catch (_) { /* Private/storage-blocked mode remains usable. */ }
  }

  function storageRemove(key) {
    try { localStorage.removeItem(key); } catch (_) { /* optional */ }
  }

  function currentCampaign() {
    const clean = {};
    utmKeys.forEach(key => {
      const value = campaignValue(params.get(key));
      if (value) clean[key] = value;
    });
    return clean;
  }

  function safePageUrl() {
    // Never forward arbitrary query strings, WhatsApp text, fbclid or hash into analytics payloads.
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
      utmKeys.forEach(key => {
        const value = campaignValue(previous[key]);
        if (value) clean[key] = value;
      });
      return clean;
    } catch (_) {
      return current;
    }
  }

  function campaignParams() {
    const out = {};
    if (campaign.utm_source) out.campaign_source = campaign.utm_source;
    if (campaign.utm_medium) out.campaign_medium = campaign.utm_medium;
    if (campaign.utm_campaign) out.campaign_name = campaign.utm_campaign;
    if (campaign.utm_content) out.creative_name = campaign.utm_content;
    if (campaign.utm_term) out.audience_name = campaign.utm_term;
    return out;
  }

  function recordGA(name, values) {
    if (!debug) return;
    const item = { platform: 'ga4', event: name, parameters: { ...values } };
    testEvents.push(item);
    console.info('[MateGrowth GA4]', name, values);
  }

  function recordMeta(name, values) {
    if (!debug) return;
    const item = { platform: 'meta', event: name, parameters: { ...values } };
    metaTestEvents.push(item);
    console.info('[MateGrowth Meta]', name, values);
  }

  function sendGA(name, values = {}) {
    const payload = {
      page_type: PAGE_TYPE,
      page_language: 'pt-BR',
      product: PRODUCT,
      ...campaignParams(),
      ...values,
      send_to: GA_ID
    };
    if (debug) payload.debug_mode = true;
    recordGA(name, payload);
    if (!testMode && typeof window.gtag === 'function') window.gtag('event', name, payload);
  }

  function sendMetaStandard(name, values = {}) {
    const payload = {
      content_name: PRODUCT,
      content_category: 'daycare_website_service',
      ...values
    };
    recordMeta(name, payload);
    if (!testMode && metaInitialized && typeof window.fbq === 'function') window.fbq('track', name, payload);
  }

  function sendMetaCustom(name, values = {}) {
    const payload = {
      page_type: PAGE_TYPE,
      product: PRODUCT,
      ...campaignParams(),
      ...values
    };
    recordMeta(name, payload);
    if (!testMode && metaInitialized && typeof window.fbq === 'function') window.fbq('trackCustom', name, payload);
  }

  function track(name, values = {}) {
    if (consent !== 'granted' || !gaInitialized || !eventNames.has(name)) return false;
    const clean = {};
    Object.entries(values).forEach(([key, value]) => {
      if (!allowedParams.has(key)) return;
      if (typeof value === 'number' && Number.isFinite(value)) clean[key] = value;
      else if (safeValue(value)) clean[key] = value;
    });
    sendGA(name, clean);
    return true;
  }

  function clearAnalyticsCookies() {
    let names = [];
    try {
      names = document.cookie
        .split(';')
        .map(value => value.split('=')[0].trim())
        .filter(name => name === '_ga' || name.startsWith('_ga_') || name === '_fbp' || name === '_fbc');
    } catch (_) { /* Sandboxed previews may forbid cookie access. */ }

    const domains = [null, location.hostname, '.' + location.hostname];
    if (location.hostname === 'mategrowth.com' || location.hostname.endsWith('.mategrowth.com')) domains.push('.mategrowth.com');

    names.forEach(name => domains.forEach(domain => {
      try {
        document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax${domain ? '; domain=' + domain : ''}`;
      } catch (_) { /* Storage can be disabled by the browser. */ }
    }));

    try { sessionStorage.removeItem(CAMPAIGN_KEY); } catch (_) { /* optional attribution cache */ }
  }

  function initializeGA() {
    if (!GA_ID || !/^G-[A-Z0-9]+$/.test(GA_ID) || consent !== 'granted') return;
    campaign = getCampaign();
    window[`ga-disable-${GA_ID}`] = false;

    if (!gaInitialized) {
      if (!testMode) {
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function() { window.dataLayer.push(arguments); };
        window.gtag('consent', 'default', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied'
        });
        window.gtag('consent', 'update', {
          analytics_storage: 'granted',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied'
        });
        window.gtag('js', new Date());
        window.gtag('config', GA_ID, {
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
          script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
          document.head.appendChild(script);
        }
      }
      gaInitialized = true;
    } else if (!testMode && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
    }

    if (!pageViewSent) {
      sendGA('page_view', {
        page_title: document.title,
        page_location: safePageUrl(),
        page_referrer: safeReferrer()
      });
      pageViewSent = true;
    }
  }

  function initializeMeta() {
    if (!/^\d{5,25}$/.test(META_PIXEL_ID) || consent !== 'granted') return;
    campaign = getCampaign();

    if (!metaInitialized) {
      if (!testMode) {
        // Meta Pixel base loader, injected only after explicit analytics consent.
        /* eslint-disable */
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
        (window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
        /* eslint-enable */
        window.fbq('init', META_PIXEL_ID);
      }
      metaInitialized = true;
    }

    if (!metaPageViewSent) {
      sendMetaStandard('PageView');
      metaPageViewSent = true;
    }
    if (!metaViewContentSent) {
      sendMetaStandard('ViewContent', {
        content_ids: [PRODUCT],
        content_type: 'product'
      });
      metaViewContentSent = true;
    }
  }

  function initializeAnalytics() {
    if (consent !== 'granted') return;
    campaign = getCampaign();
    initializeGA();
    initializeMeta();
    startObservers();
  }

  function consentChanged(choice) {
    consent = choice;
    storageSet(CONSENT_KEY, JSON.stringify({ choice, updated_at: new Date().toISOString() }));
    // Previous consent covered GA4 only; do not silently reuse it for Meta Pixel.
    storageRemove(LEGACY_CONSENT_KEY);
    if (banner) banner.hidden = true;

    if (choice === 'granted') {
      initializeAnalytics();
    } else {
      if (GA_ID) window[`ga-disable-${GA_ID}`] = true;
      if (gaInitialized && !testMode && typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied'
        });
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

      document.querySelectorAll('[data-observe]').forEach(element => observer.observe(element));
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
    const element = event.target.closest?.('[data-track]');
    if (!element) return;

    const payload = { cta_location: safeValue(element.dataset.ctaLocation) || 'unknown' };
    if (element.dataset.plan) payload.plan = safeValue(element.dataset.plan) || 'none';
    if (element.dataset.project) payload.project = safeValue(element.dataset.project);

    if (element.dataset.track === 'whatsapp_click') {
      const planPrice = prices[element.dataset.plan];
      if (planPrice) {
        payload.plan_price = planPrice;
        track('plan_select', payload);
      }

      // Same consent rule as GA4. This is a CLICK signal only, never a confirmed lead.
      if (consent === 'granted') {
        sendMetaCustom('WhatsAppClick', {
          cta_location: payload.cta_location,
          plan: payload.plan || 'none',
          ...(planPrice ? { value: planPrice, currency: 'USD' } : {})
        });
      }
    }

    track(element.dataset.track, payload);
    // Do not preventDefault or delay WhatsApp/navigation for analytics.
  });

  document.querySelectorAll('[data-consent]').forEach(button => {
    button.addEventListener('click', () => consentChanged(button.dataset.consent));
  });

  document.querySelectorAll('[data-consent-settings]').forEach(button => {
    button.addEventListener('click', () => {
      if (banner) {
        banner.hidden = false;
        banner.querySelector('button')?.focus();
      }
      document.dispatchEvent(new CustomEvent('mg:consent-panel'));
    });
  });

  window.addEventListener('scroll', () => {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(trackScroll);
    }
  }, { passive: true });

  window.MGAnalytics = Object.freeze({
    track,
    testEvents,
    metaTestEvents,
    testMode,
    getConsent: () => consent,
    getCampaign: () => ({ ...campaign }),
    safePageUrl,
    metaPixelConfigured: /^\d{5,25}$/.test(META_PIXEL_ID)
  });

  try {
    const stored = JSON.parse(storageGet(CONSENT_KEY) || 'null');
    if (stored && ['granted', 'denied'].includes(stored.choice)) consent = stored.choice;
  } catch (_) {
    consent = 'unknown';
  }

  if (banner) banner.hidden = consent !== 'unknown';
  if (consent === 'granted') initializeAnalytics();
})();
