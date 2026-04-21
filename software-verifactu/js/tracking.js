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

  // Append UTMs to all internal links/CTAs so they propagate to the signup flow
  function propagateUTMs() {
    const utms = getStoredUTMs();
    const qs = new URLSearchParams();
    UTM_KEYS.forEach((k) => { if (utms[k]) qs.set(k, utms[k]); });
    const qsStr = qs.toString();
    if (!qsStr) return;

    document.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      try {
        const url = new URL(href, window.location.origin);
        // Only append to external destinations or signup routes, not anchor links
        UTM_KEYS.forEach((k) => { if (utms[k] && !url.searchParams.has(k)) url.searchParams.set(k, utms[k]); });
        a.setAttribute('href', url.pathname + url.search + url.hash);
      } catch (e) {}
    });
  }

  // -------- 2. META PIXEL (placeholder) --------
  // Reemplaza 'YOUR_PIXEL_ID' por tu ID real cuando lo tengas
  const META_PIXEL_ID = 'YOUR_PIXEL_ID';

  function loadMetaPixel(pixelId) {
    if (!pixelId || pixelId === 'YOUR_PIXEL_ID') {
      console.warn('[tracking] Meta Pixel ID no configurado');
      return;
    }
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
  }

  // -------- 3. GA4 (placeholder) --------
  const GA4_ID = 'G-XXXXXXXXXX';
  function loadGA4(id) {
    if (!id || id === 'G-XXXXXXXXXX') {
      console.warn('[tracking] GA4 ID no configurado');
      return;
    }
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id);
  }

  // -------- 4. EVENT TRACKING --------
  function trackEvent(name, params = {}) {
    const utms = getStoredUTMs();
    const payload = { ...params, ...utms };
    console.log('[track]', name, payload);
    if (window.fbq) window.fbq('trackCustom', name, payload);
    if (window.gtag) window.gtag('event', name, payload);
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
    loadMetaPixel(META_PIXEL_ID);
    loadGA4(GA4_ID);
    bindCTAs();
    trackEvent('landing_view', { landing: 'factupro' });
  });

  // Expose for debugging
  window.__tracking = { getStoredUTMs, trackEvent };
})();
