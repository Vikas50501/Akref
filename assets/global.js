/* AKINNA — global theme JS (dependency-free)
   - IntersectionObserver lazyload + scroll reveal + parallax
   - Predictive quick add-to-cart
   - Accordion, tabs, drawers, modals via custom elements / data hooks
   - Lightweight carousel (used when Swiper isn't loaded)
*/
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Lazyload (data-src / native fallback) ---------- */
  function initLazy() {
    var imgs = document.querySelectorAll('img.lazyload[data-src], img.lazyload[data-srcset]');
    if (!('IntersectionObserver' in window)) {
      imgs.forEach(loadImg); return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) { if (e.isIntersecting) { loadImg(e.target); obs.unobserve(e.target); } });
    }, { rootMargin: '400px 0px' });
    imgs.forEach(function (img) { io.observe(img); });
  }
  function loadImg(img) {
    if (img.dataset.src) img.src = img.dataset.src;
    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    img.classList.add('lazyloading');
    img.addEventListener('load', function () { img.classList.remove('lazyloading', 'lazyload'); img.classList.add('lazyloaded'); });
  }

  /* ---------- Scroll reveal ([data-anim]) ---------- */
  function initReveal() {
    var els = document.querySelectorAll('[data-anim]');
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-inview'); }); return; }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var delay = e.target.getAttribute('data-anim-delay');
          if (delay) e.target.style.transitionDelay = delay + 'ms';
          e.target.classList.add('is-inview');
          obs.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Split-text headings (letters-slide-up) ---------- */
  function initSplit() {
    if (reduce) return;
    document.querySelectorAll('.letters-slide-up.text-split').forEach(function (el) {
      if (el.dataset.split) return; el.dataset.split = '1';
      var words = el.textContent.trim().split(/\s+/);
      el.innerHTML = words.map(function (w) {
        return '<span class="split-word"><span class="split-inner">' + w + '</span></span>';
      }).join(' ');
    });
  }

  /* ---------- Parallax (gsap-parallax replacement) ---------- */
  function initParallax() {
    if (reduce) return;
    var items = document.querySelectorAll('[gsap-parallax],[gsap-parallax-reverse],.gsap-parallax');
    if (!items.length) return;
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      // Read phase: measure everything first (avoids layout thrash), then write.
      var writes = [];
      items.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var reverse = el.hasAttribute('gsap-parallax-reverse');
        var progress = (r.top + r.height / 2 - vh / 2) / vh; // -1..1
        var shift = progress * (reverse ? 30 : -30);
        writes.push([el, shift]);
      });
      writes.forEach(function (w) { w[0].style.transform = 'translate3d(0,' + w[1].toFixed(1) + 'px,0)'; });
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- Accordion (data-accordion) ---------- */
  function initAccordions() {
    document.querySelectorAll('[data-accordion]').forEach(function (root) {
      root.querySelectorAll('[data-accordion-trigger]').forEach(function (trig) {
        trig.addEventListener('click', function () {
          var item = trig.closest('[data-accordion-item]');
          var open = item.classList.contains('is-open');
          if (!root.hasAttribute('data-accordion-multi')) {
            root.querySelectorAll('[data-accordion-item].is-open').forEach(function (i) { if (i !== item) { i.classList.remove('is-open'); setPanel(i, false); } });
          }
          item.classList.toggle('is-open', !open);
          setPanel(item, !open);
          trig.setAttribute('aria-expanded', String(!open));
        });
      });
    });
  }
  function setPanel(item, open) {
    var panel = item.querySelector('[data-accordion-panel]');
    if (!panel) return;
    panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
  }

  /* ---------- Quick add to cart ---------- */
  function initQuickAdd() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('product-quick-add .add_to_cart_button');
      if (!btn) return;
      var id = btn.getAttribute('data-id');
      if (!id) return;
      e.preventDefault();
      if (btn.classList.contains('is-loading')) return;
      btn.classList.add('is-loading');
      var label = btn.querySelector('[data-add-text]') || btn;
      var prev = label.textContent;
      fetch(window.Shopify && window.Shopify.routes ? window.Shopify.routes.root + 'cart/add.js' : '/cart/add.js', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ items: [{ id: id, quantity: 1 }] })
      }).then(function (r) { return r.json(); }).then(function (res) {
        btn.classList.remove('is-loading');
        if (res && res.status) {
          label.textContent = res.description || res.message || prev;
          setTimeout(function () { label.textContent = prev; }, 2500);
          return;
        }
        document.dispatchEvent(new CustomEvent('cart:refresh', { detail: { open: true } }));
      }).catch(function () { btn.classList.remove('is-loading'); });
    });
  }

  /* ---------- Boot ---------- */
  function boot() {
    initLazy(); initReveal(); initSplit(); initParallax(); initAccordions(); initQuickAdd();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.AKINNA = { initLazy: initLazy, initReveal: initReveal, initAccordions: initAccordions };
})();
