/* AKINNA — lightweight carousel used by product/testimonial/logo sliders.
   Progressive: if a section opts into Swiper via [data-swiper] and window.Swiper
   exists it will be used; otherwise this native fallback drives [data-carousel]. */
(function () {
  'use strict';

  function Carousel(root) {
    this.root = root;
    this.track = root.querySelector('[data-carousel-track]');
    this.slides = Array.prototype.slice.call(root.querySelectorAll('[data-carousel-slide]'));
    this.prev = root.querySelector('[data-carousel-prev]');
    this.next = root.querySelector('[data-carousel-next]');
    this.pagination = root.querySelector('[data-carousel-pagination]');
    this.index = 0;
    this.timer = null;
    if (!this.track || this.slides.length === 0) return;
    this.reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.bind();
    this.update();
    this.autoplayMs = parseInt(root.getAttribute('data-autoplay') || '0', 10);
    if (this.autoplayMs > 0 && !this.reduce) this.startAuto();
  }
  Carousel.prototype.pages = function () {
    return Math.max(1, Math.ceil(this.slides.length / this.perView()));
  };
  Carousel.prototype.perView = function () {
    var s = this.slides[0];
    var gap = parseFloat(getComputedStyle(this.track).columnGap || getComputedStyle(this.track).gap || '0') || 0;
    var w = s.getBoundingClientRect().width + gap;
    return Math.max(1, Math.round(this.track.getBoundingClientRect().width / w));
  };
  Carousel.prototype.maxIndex = function () {
    return Math.max(0, this.slides.length - this.perView());
  };
  Carousel.prototype.bind = function () {
    var self = this;
    if (this.prev) this.prev.addEventListener('click', function () { self.go(self.index - 1); });
    if (this.next) this.next.addEventListener('click', function () { self.go(self.index + 1); });
    // drag / swipe
    var startX = 0, scroll0 = 0, dragging = false;
    this.track.addEventListener('pointerdown', function (e) { dragging = true; startX = e.clientX; scroll0 = self.track.scrollLeft; self.track.setPointerCapture(e.pointerId); });
    this.track.addEventListener('pointermove', function (e) { if (dragging) self.track.scrollLeft = scroll0 - (e.clientX - startX); });
    this.track.addEventListener('pointerup', function () { dragging = false; self.syncIndexFromScroll(); });
    this.track.addEventListener('scroll', function () { self.syncIndexFromScroll(); }, { passive: true });
    window.addEventListener('resize', function () { self.update(); });
    // Pause autoplay on hover/focus for usability.
    this.root.addEventListener('pointerenter', function () { self.stopAuto(); });
    this.root.addEventListener('pointerleave', function () { if (self.autoplayMs > 0 && !self.reduce) self.startAuto(); });
    this.root.addEventListener('focusin', function () { self.stopAuto(); });
    this.root.addEventListener('focusout', function () { if (self.autoplayMs > 0 && !self.reduce) self.startAuto(); });
  };
  Carousel.prototype.syncIndexFromScroll = function () {
    var s = this.slides[0]; if (!s) return;
    var gap = parseFloat(getComputedStyle(this.track).gap || '0') || 0;
    var w = s.getBoundingClientRect().width + gap;
    this.index = Math.round(this.track.scrollLeft / w);
    this.update(true);
  };
  Carousel.prototype.go = function (i) {
    this.index = Math.max(0, Math.min(i, this.maxIndex()));
    var s = this.slides[this.index];
    if (s) this.track.scrollTo({ left: s.offsetLeft - this.track.offsetLeft, behavior: 'smooth' });
    this.update();
  };
  Carousel.prototype.update = function (fromScroll) {
    if (this.prev) this.prev.toggleAttribute('disabled', this.index <= 0);
    if (this.next) this.next.toggleAttribute('disabled', this.index >= this.maxIndex());
    if (this.pagination) {
      var pv = this.perView();
      var page = Math.floor(this.index / pv) + 1;
      this.pagination.textContent = page + ' / ' + this.pages();
    }
  };
  Carousel.prototype.startAuto = function () {
    var self = this;
    this.stopAuto();
    this.timer = setInterval(function () {
      if (document.hidden) return;
      self.go(self.index >= self.maxIndex() ? 0 : self.index + 1);
    }, this.autoplayMs);
  };
  Carousel.prototype.stopAuto = function () { if (this.timer) { clearInterval(this.timer); this.timer = null; } };

  function init() {
    document.querySelectorAll('[data-carousel]').forEach(function (el) {
      if (el.__carousel) return;
      if (el.hasAttribute('data-fade')) return; // fade sliders (hero) run their own script
      el.__carousel = new Carousel(el);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.AKINNA = window.AKINNA || {}; window.AKINNA.initCarousels = init;
})();
