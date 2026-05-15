// Injects the shared MegaGamee footer into every page.
// On game pages, the footer starts collapsed to a thin strip so it doesn't
// block gameplay; tapping the tab expands it.

(function () {
  'use strict';

  const TELEGRAM_URL = 'https://t.me/megagamee'; // TODO: replace with real channel handle

  // Treat any page whose path contains "/games/" as a game page.
  const isGamePage = location.pathname.includes('/games/');

  const footer = document.createElement('footer');
  footer.className = 'ocs8-footer' + (isGamePage ? ' collapsed' : '');
  footer.innerHTML = `
    ${isGamePage ? '<button class="toggle" aria-label="Toggle footer" aria-expanded="false">&#9650;</button>' : ''}
    <a href="${TELEGRAM_URL}" class="tg-btn aff-link" target="_blank" rel="noopener">Join Telegram</a>
  `;

  function mount() {
    document.body.appendChild(footer);
    if (window.MegaGameeTracking) window.MegaGameeTracking.decorate(footer);

    const toggle = footer.querySelector('.toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const collapsed = footer.classList.toggle('collapsed');
        toggle.innerHTML = collapsed ? '&#9650;' : '&#9660;';
        toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
