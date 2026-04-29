// ============================================
// FACTUPRO — TRACKING & UTM HANDLING
// ============================================

(function () {
  'use strict';

  // -------- 1. UTM CAPTURE & PERSISTENCE --------
  const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
  const STORAGE_KEY = 'factupro_utms';

  function captureUTMs() {
    const params = new URLSearchParams(window.location.search);
    const utms = {};
    let found = false;
    UTM_KEYS.forEach((k) => {
      const v = params.get(k);
      if (v) { utms[k] = v; found = true; }
    });
    if (found) {
      utms._captured_at = new Date().toISOString();
      utms._landing = window.location.pathname;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(utms)); } catch (e) {}
    }
    return getStoredUTMs();
  }

  function getStoredUTMs() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (e) { return {}; }
  }

  function propagateUTMs() {
    const utms = getStoredUTMs();
    const qs = new URLSearchParams();
    UTM_KEYS.forEach((k) => { if (utms[k]) qs.set(k, utms[k]); });
    if (!qs.toString()) return;
    document.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      try {
        const url = new URL(href, window.location.origin);
        UTM_KEYS.forEach((k) => { if (utms[k] && !url.searchParams.has(k)) url.searchParams.set(k, utms[k]); });
        a.setAttribute('href', url.href);
      } catch (e) {}
    });
  }

  // -------- 2. MICROSOFT CLARITY (no requiere consentimiento explícito) --------
  const CLARITY_ID = 'wf6v2t8wce';

  function loadClarity(id) {
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", id);
  }

  // -------- 3. META PIXEL (requiere consentimiento: advertisement) --------
  const META_PIXEL_ID = '811718112008616';

  function loadMetaPixel(pixelId) {
    if (!pixelId || pixelId === 'YOUR_PIXEL_ID') return;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
  }

  // -------- 4. GA4 (requiere consentimiento: analytics) --------
  const GA4_ID = 'G-6ZGED0SL4E';

  function loadGA4(id) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id);
  }

  // -------- 5. COOKIEYES CONSENT --------
  // Comprueba si el usuario ya dio consentimiento en visitas previas
  function getCookieYesConsent() {
    const match = document.cookie.match(/cookieyes-consent=([^;]+)/);
    if (!match) return {};
    try {
      return Object.fromEntries(
        decodeURIComponent(match[1]).split(',').map(p => p.split(':'))
      );
    } catch (e) { return {}; }
  }

  function initConsentedTrackers() {
    const consent = getCookieYesConsent();
    if (consent.analytics === 'yes') loadGA4(GA4_ID);
    if (consent.advertisement === 'yes') loadMetaPixel(META_PIXEL_ID);
  }

  // Escucha cambios en tiempo real (cuando el usuario acepta/rechaza en el banner)
  document.addEventListener('cookieyes-consent-update', function (e) {
    const { accepted = [] } = e.detail || {};
    if (accepted.includes('analytics') && !window.gtag) loadGA4(GA4_ID);
    if (accepted.includes('advertisement') && !window.fbq) loadMetaPixel(META_PIXEL_ID);
  });

  // -------- 6. EVENT TRACKING --------
  function trackEvent(name, params = {}) {
    const utms = getStoredUTMs();
    const payload = { ...params, ...utms };
    if (window.fbq) window.fbq('trackCustom', name, payload);
    if (window.gtag) window.gtag('event', name, payload);
    if (window.clarity) window.clarity('set', name, JSON.stringify(payload));
  }

  function bindCTAs() {
    document.querySelectorAll('[data-cta]').forEach((el) => {
      el.addEventListener('click', () => {
        trackEvent('cta_click', { cta: el.dataset.cta, text: el.innerText.trim() });
      });
    });
  }

  // -------- INIT --------
  document.addEventListener('DOMContentLoaded', () => {
    captureUTMs();
    propagateUTMs();
    loadClarity(CLARITY_ID);
    initConsentedTrackers();
    bindCTAs();
    trackEvent('landing_view', { landing: window.location.pathname });
  });

  window.__tracking = { getStoredUTMs, trackEvent };
})();
