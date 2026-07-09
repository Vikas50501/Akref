/* AKINNA — collection filtering & sorting (AJAX, history-aware) */
(function () {
  'use strict';
  var root = document.querySelector('[data-collection]');
  if (!root) return;
  var form = root.querySelector('[data-facet-form]');
  var sort = root.querySelector('[data-sort]');
  var grid = root.querySelector('[data-collection-grid]');

  function sectionId() {
    var s = root.closest('.shopify-section');
    return s ? s.id.replace('shopify-section-', '') : null;
  }

  function fetchAndRender(url, push, scroll) {
    grid.classList.add('is-loading');
    grid.setAttribute('aria-busy', 'true');
    var fetchUrl = url + (url.indexOf('?') === -1 ? '?' : '&') + 'section_id=' + sectionId();
    fetch(fetchUrl).then(function (r) { return r.text(); }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var freshGrid = doc.querySelector('[data-collection-grid]');
      var freshCount = doc.querySelector('#ProductCount');
      var freshFacets = doc.querySelector('[data-facet-form]');
      var freshSort = doc.querySelector('[data-sort]');
      if (freshGrid) grid.innerHTML = freshGrid.innerHTML;
      if (freshCount) { var c = root.querySelector('#ProductCount'); if (c) c.innerHTML = freshCount.innerHTML; }
      if (freshFacets && form) form.innerHTML = freshFacets.innerHTML;
      if (freshSort && sort) sort.value = freshSort.value; // keep sort select in sync (e.g. on back/forward)
      grid.classList.remove('is-loading');
      grid.setAttribute('aria-busy', 'false');
      if (push && history.pushState) history.pushState({ url: url }, '', url);
      if (window.AKINNA && window.AKINNA.initLazy) window.AKINNA.initLazy();
      if (window.AKINNA && window.AKINNA.initReveal) window.AKINNA.initReveal();
      if (window.AKINNA && window.AKINNA.initAccordions) window.AKINNA.initAccordions();
      if (scroll !== false) {
        var top = root.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    }).catch(function () { grid.classList.remove('is-loading'); grid.setAttribute('aria-busy', 'false'); });
  }

  function buildUrl() {
    var params = new URLSearchParams(new FormData(form));
    // strip empty
    var clean = new URLSearchParams();
    params.forEach(function (v, k) { if (v !== '') clean.append(k, v); });
    if (sort && sort.value) clean.set('sort_by', sort.value);
    var base = window.location.pathname;
    var qs = clean.toString();
    return qs ? base + '?' + qs : base;
  }

  if (form) {
    form.addEventListener('submit', function (e) { e.preventDefault(); fetchAndRender(buildUrl(), true); });
    form.addEventListener('change', function (e) {
      if (e.target.type === 'checkbox' || e.target.matches('[data-price-min], [data-price-max]')) {
        fetchAndRender(buildUrl(), true);
      }
    });
  }
  if (sort) sort.addEventListener('change', function () { fetchAndRender(buildUrl(), true); });

  window.addEventListener('popstate', function (e) {
    fetchAndRender(window.location.pathname + window.location.search, false, false);
  });
})();

/* Dual-handle price range slider — syncs to the named number inputs the facet form
   submits, and paints the fill between the two handles. */
if (!customElements.get('price-range')) {
  customElements.define('price-range', class extends HTMLElement {
    connectedCallback() {
      this.max = parseFloat(this.getAttribute('data-max')) || 0;
      this.sMin = this.querySelector('[data-slider-min]');
      this.sMax = this.querySelector('[data-slider-max]');
      this.fMin = this.querySelector('[data-price-min]');
      this.fMax = this.querySelector('[data-price-max]');
      this.fill = this.querySelector('[data-slider-fill]');
      if (!this.sMin || !this.sMax) return;
      this.sMin.addEventListener('input', this.fromSlider.bind(this));
      this.sMax.addEventListener('input', this.fromSlider.bind(this));
      this.sMin.addEventListener('change', this.commit.bind(this));
      this.sMax.addEventListener('change', this.commit.bind(this));
      if (this.fMin) this.fMin.addEventListener('input', this.fromField.bind(this));
      if (this.fMax) this.fMax.addEventListener('input', this.fromField.bind(this));
      this.paint();
    }
    clamp() {
      var lo = parseFloat(this.sMin.value), hi = parseFloat(this.sMax.value);
      if (lo > hi) { var t = lo; lo = hi; hi = t; }
      this.sMin.value = lo; this.sMax.value = hi;
      return [lo, hi];
    }
    paint() {
      var lo = parseFloat(this.sMin.value), hi = parseFloat(this.sMax.value);
      if (this.fill && this.max > 0) {
        this.fill.style.left = (lo / this.max * 100) + '%';
        this.fill.style.right = (100 - hi / this.max * 100) + '%';
      }
    }
    fromSlider() {
      var v = this.clamp();
      if (this.fMin) this.fMin.value = v[0] > 0 ? v[0] : '';
      if (this.fMax) this.fMax.value = v[1] < this.max ? v[1] : '';
      this.paint();
    }
    fromField() {
      if (this.fMin && this.fMin.value !== '') this.sMin.value = this.fMin.value;
      if (this.fMax && this.fMax.value !== '') this.sMax.value = this.fMax.value;
      this.paint();
    }
    commit() {
      // Trigger the facet form's change handler via the named number input.
      if (this.fMin) this.fMin.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
}
