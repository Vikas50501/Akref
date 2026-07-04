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
      if (e.target.type === 'checkbox') fetchAndRender(buildUrl(), true);
    });
  }
  if (sort) sort.addEventListener('change', function () { fetchAndRender(buildUrl(), true); });

  window.addEventListener('popstate', function (e) {
    fetchAndRender(window.location.pathname + window.location.search, false, false);
  });
})();
