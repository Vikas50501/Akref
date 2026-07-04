/* AKINNA — recently viewed products (localStorage + section-render fetch) */
(function () {
  'use strict';
  var KEY = 'akinna:recently-viewed';
  var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';

  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function write(list) { try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 12))); } catch (e) {} }

  // Track the current product (main-product carries the handle)
  var current = document.querySelector('.main-product[data-product-handle]');
  if (current) {
    var handle = current.getAttribute('data-product-handle');
    if (handle) {
      var list = read().filter(function (h) { return h !== handle; });
      list.unshift(handle);
      write(list);
    }
  }

  // Render the widget if present
  var widget = document.querySelector('recently-viewed');
  if (!widget) return;
  var grid = widget.querySelector('[data-recently-grid]');
  var limit = parseInt(widget.getAttribute('data-limit'), 10) || 4;
  var exclude = widget.getAttribute('data-exclude') || '';
  var handles = read().filter(function (h) { return h && h !== exclude; }).slice(0, limit);
  if (!handles.length || !grid) return;

  Promise.all(handles.map(function (h) {
    return fetch(root + 'products/' + h + '?section_id=product-card-render', { headers: { 'Accept': 'text/html' } })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (html) { return html ? html.trim() : ''; })
      .catch(function () { return ''; });
  })).then(function (cards) {
    var frag = document.createElement('div');
    frag.innerHTML = cards.join('');
    if (frag.children.length) {
      grid.appendChild(frag);
      // unwrap the temporary container
      while (frag.firstChild) grid.appendChild(frag.firstChild);
      widget.removeAttribute('hidden');
      if (window.AKINNA && window.AKINNA.initLazy) window.AKINNA.initLazy();
    }
  });
})();
