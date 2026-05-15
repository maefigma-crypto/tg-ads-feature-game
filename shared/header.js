// Injects the shared MegaGamee header into every page.
// Logo links back to the hub. No outbound CTA in the header — the only
// outbound link lives in the footer (Join Telegram).
// NOTE: this is a placeholder header; the planned redesign swaps the logo for
// a Telegram-style profile (avatar + name + @username) on the left.

(function () {
  'use strict';

  // Resolve the hub link relative to the current page so it works from any depth
  // (hub at /, games at /games/dino/, etc.) without hardcoding deploy domain.
  const hubHref = document.body && document.body.dataset.hubHref
    ? document.body.dataset.hubHref
    : (location.pathname.includes('/games/') ? '../../' : './');

  const header = document.createElement('header');
  header.className = 'ocs8-header';
  header.innerHTML = `
    <a href="${hubHref}" class="logo" aria-label="MegaGamee home">Mega<span>Gamee</span></a>
    <span class="brand-tag">PLAY FOR FUN</span>
  `;

  function mount() {
    document.body.prepend(header);
    if (window.MegaGameeTracking) window.MegaGameeTracking.decorate(header);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
