/* AKINNA — cart AJAX: qty update, remove, live re-render of drawer + count */
(function () {
  'use strict';
  var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';

  function money(cents) {
    try { return (window.Shopify && Shopify.formatMoney) ? Shopify.formatMoney(cents, window.moneyFormat) : '₹ ' + (cents / 100).toLocaleString(); }
    catch (e) { return '₹ ' + (cents / 100).toFixed(2); }
  }

  function refresh() {
    return fetch(root + '?section_id=cart-drawer-render', { headers: { 'Accept': 'text/html' } })
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (html) {
        if (html) {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var fresh = doc.querySelector('[data-cart-body]');
          var cur = document.querySelector('#cart-drawer [data-cart-body]');
          if (fresh && cur) cur.innerHTML = fresh.innerHTML;
        }
        return fetch(root + 'cart.js', { headers: { 'Accept': 'application/json' } }).then(function (r) { return r.json(); });
      })
      .then(function (cart) { if (cart) updateCounts(cart); return cart; })
      .catch(function () {});
  }

  function updateCounts(cart) {
    if (!cart || typeof cart.item_count === 'undefined') return;
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = cart.item_count;
      el.classList.toggle('is-empty', cart.item_count === 0);
    });
    document.querySelectorAll('[data-cart-subtotal]').forEach(function (el) { el.textContent = money(cart.total_price); });
  }

  var busy = false;
  function changeLine(key, qty) {
    if (busy) return Promise.resolve();
    busy = true;
    return fetch(root + 'cart/change.js', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ id: key, quantity: qty })
    })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        // change.js returns {status:422,...} when qty exceeds stock — re-sync from server, don't write bad counts.
        if (cart && cart.status) { return refresh(); }
        updateCounts(cart);
        return refresh();
      })
      .catch(function () { return refresh(); })
      .then(function () { busy = false; });
  }

  document.addEventListener('click', function (e) {
    var rem = e.target.closest('[data-cart-remove]');
    if (rem) { e.preventDefault(); changeLine(rem.getAttribute('data-cart-remove'), 0); return; }
    var minus = e.target.closest('[data-qty-minus]');
    var plus = e.target.closest('[data-qty-plus]');
    if (minus || plus) {
      var wrap = (minus || plus).closest('[data-key]');
      if (!wrap) return; // product-page quantity-input (no data-key) is handled by product.js
      var input = wrap.querySelector('[data-qty-input]');
      var val = parseInt(input.value, 10) || 0;
      val = plus ? val + 1 : Math.max(0, val - 1);
      input.value = val;
      changeLine(wrap.getAttribute('data-key'), val);
    }
  });
  document.addEventListener('change', function (e) {
    var input = e.target.closest('[data-qty-input]');
    if (!input) return;
    var wrap = input.closest('[data-key]');
    if (!wrap) return;
    changeLine(wrap.getAttribute('data-key'), Math.max(0, parseInt(input.value, 10) || 0));
  });

  // cart:refresh with {detail:{open:true}} re-renders then opens the drawer (no race).
  document.addEventListener('cart:refresh', function (e) {
    refresh().then(function () {
      if (e && e.detail && e.detail.open) document.dispatchEvent(new CustomEvent('cart:open'));
    });
  });
  window.AKINNA = window.AKINNA || {}; window.AKINNA.refreshCart = refresh;
})();
