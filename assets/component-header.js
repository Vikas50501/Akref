/* AKINNA — header behavior: transparent→solid on scroll, drawers, search modal, cart */
(function () {
  'use strict';

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /* Sticky + transparent header states */
  function initHeaderScroll() {
    var header = document.querySelector('theme-header, .header');
    if (!header) return;
    var transparent = header.classList.contains('header--transparent');
    var threshold = transparent ? Math.min(120, window.innerHeight * 0.6) : 4;
    function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > threshold); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Generic drawer/modal open-close (data-drawer-open="id" / data-drawer-close) */
  var lastFocus = null;
  var openCount = 0;
  var trapHandler = null;

  function focusable(panel) {
    return Array.prototype.filter.call(panel.querySelectorAll(FOCUSABLE), function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
  }
  function trap(panel, e) {
    if (e.key !== 'Tab') return;
    var items = focusable(panel);
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function openPanel(panel) {
    if (!panel || panel.classList.contains('is-open')) return;
    lastFocus = document.activeElement;
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    openCount++;
    var f = focusable(panel)[0];
    if (f) setTimeout(function () { f.focus(); }, 60);
    trapHandler = function (e) { trap(panel, e); };
    panel.addEventListener('keydown', trapHandler);
    panel.__trap = trapHandler;
  }
  function closePanel(panel) {
    if (!panel || !panel.classList.contains('is-open')) return;
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    if (panel.__trap) { panel.removeEventListener('keydown', panel.__trap); panel.__trap = null; }
    openCount = Math.max(0, openCount - 1);
    if (openCount === 0) document.documentElement.style.overflow = '';
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }
  function initPanels() {
    document.addEventListener('click', function (e) {
      var opener = e.target.closest('[data-drawer-open]');
      if (opener) { e.preventDefault(); openPanel(document.getElementById(opener.getAttribute('data-drawer-open'))); return; }
      if (e.target.closest('[data-search-open]')) { e.preventDefault(); openPanel(document.getElementById('search-modal')); return; }
      if (e.target.closest('[data-cart-open]')) {
        var drawer = document.getElementById('cart-drawer');
        if (drawer && document.body.getAttribute('data-cart-type') !== 'page') { e.preventDefault(); openPanel(drawer); }
        return;
      }
      var closer = e.target.closest('[data-drawer-close]');
      if (closer) { var p = closer.closest('[data-drawer], .side-panel, .search-modal'); closePanel(p); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var open = document.querySelector('.side-panel.is-open, .search-modal.is-open, [data-drawer].is-open');
        if (open) closePanel(open);
      }
    });
    document.addEventListener('cart:open', function () {
      var drawer = document.getElementById('cart-drawer');
      if (drawer && document.body.getAttribute('data-cart-type') !== 'page') openPanel(drawer);
    });
  }

  /* Keyboard accessibility for desktop dropdown/mega-menu: sync aria-expanded */
  function initMenuA11y() {
    var items = document.querySelectorAll('.header__item.has-children, .header__item.has-megamenu');
    Array.prototype.forEach.call(items, function (li) {
      var link = li.querySelector('.header__link');
      if (!link) return;
      link.setAttribute('aria-haspopup', 'true');
      link.setAttribute('aria-expanded', 'false');
      li.addEventListener('focusin', function () { link.setAttribute('aria-expanded', 'true'); });
      li.addEventListener('mouseenter', function () { link.setAttribute('aria-expanded', 'true'); });
      li.addEventListener('mouseleave', function () { link.setAttribute('aria-expanded', 'false'); });
      li.addEventListener('focusout', function () {
        setTimeout(function () { if (!li.contains(document.activeElement)) link.setAttribute('aria-expanded', 'false'); }, 10);
      });
    });
  }

  function boot() { initHeaderScroll(); initPanels(); initMenuA11y(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  window.AKINNA = window.AKINNA || {}; window.AKINNA.openPanel = openPanel; window.AKINNA.closePanel = closePanel;
})();
