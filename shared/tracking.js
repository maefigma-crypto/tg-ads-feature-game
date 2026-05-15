// Affiliate / UTM param flow for MEGA888.
// Run as early as possible on every page so params are captured before
// any outbound clicks (e.g. user taps the Telegram button immediately).

(function () {
  'use strict';

  const STORAGE_KEY = 'mega888_arcade_params';
  const TRACKED = ['aff', 'utm_source', 'utm_medium', 'utm_campaign'];

  function readFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const found = {};
    let hasAny = false;
    for (const key of TRACKED) {
      const v = params.get(key);
      if (v) { found[key] = v; hasAny = true; }
    }
    return hasAny ? found : null;
  }

  function loadStored() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function save(params) {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(params)); } catch (_) {}
  }

  function merge(a, b) {
    // URL params take precedence over stored ones if both present.
    const out = Object.assign({}, b || {}, a || {});
    return Object.keys(out).length ? out : null;
  }

  function appendParamsToHref(href, params) {
    if (!href || !params) return href;
    // Leave anchors and javascript: alone.
    if (href.startsWith('#') || href.startsWith('javascript:')) return href;
    try {
      const url = new URL(href, window.location.origin);
      for (const [k, v] of Object.entries(params)) {
        if (!url.searchParams.has(k)) url.searchParams.set(k, v);
      }
      return url.toString();
    } catch (_) {
      return href;
    }
  }

  function decorate(params) {
    if (!params) return;
    const els = document.querySelectorAll('.cta-btn, .aff-link');
    els.forEach((el) => {
      const href = el.getAttribute('href');
      if (!href) return;
      el.setAttribute('href', appendParamsToHref(href, params));
    });
  }

  // Build the merged param set once and expose it for header/footer scripts
  // that inject markup after this file runs.
  const params = merge(readFromUrl(), loadStored());
  if (params) save(params);

  window.MEGA888Tracking = {
    getParams() { return params; },
    decorate(scope) {
      if (!params) return;
      const root = scope || document;
      root.querySelectorAll('.cta-btn, .aff-link').forEach((el) => {
        const href = el.getAttribute('href');
        if (href) el.setAttribute('href', appendParamsToHref(href, params));
      });
    },
  };

  // First sweep for anything already in the DOM at this point.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => decorate(params));
  } else {
    decorate(params);
  }
})();
