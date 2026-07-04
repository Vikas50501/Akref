/* AKINNA — predictive search (Shopify predictive search API) */
(function () {
  'use strict';
  var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
  var wrap = document.querySelector('[data-predictive]');
  if (!wrap) return;
  var input = wrap.querySelector('[data-predictive-input]');
  var results = document.querySelector('[data-predictive-results]');
  var timer, controller, token = 0;

  function run(q) {
    if (!q || q.length < 2) { results.hidden = true; results.innerHTML = ''; results.setAttribute('aria-busy', 'false'); return; }
    // Abort any in-flight request so a slow earlier response can't overwrite a newer one.
    if (controller) controller.abort();
    controller = ('AbortController' in window) ? new AbortController() : null;
    var mine = ++token;
    results.setAttribute('aria-busy', 'true');
    var url = root + 'search/suggest?q=' + encodeURIComponent(q) +
      '&resources[type]=product,collection,article&resources[limit]=6&section_id=predictive-search';
    fetch(url, controller ? { signal: controller.signal } : undefined)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        if (mine !== token) return; // a newer query superseded this one
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var inner = doc.querySelector('[data-predictive-inner]');
        results.innerHTML = inner ? inner.innerHTML : '';
        results.hidden = false;
        results.setAttribute('aria-busy', 'false');
      })
      .catch(function (err) { if (err && err.name === 'AbortError') return; results.hidden = true; results.setAttribute('aria-busy', 'false'); });
  }

  input.addEventListener('input', function () {
    clearTimeout(timer);
    var q = input.value.trim();
    timer = setTimeout(function () { run(q); }, 250);
  });
})();
