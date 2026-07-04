/* AKINNA — product page: variant selection, gallery sync, qty, add to cart */
(function () {
  'use strict';
  var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';

  /* ---------------- Gallery ---------------- */
  function initGallery(scope) {
    var gallery = scope.querySelector('[data-gallery]');
    if (!gallery) return;
    var slides = gallery.querySelectorAll('[data-gallery-slide]');
    var thumbs = gallery.querySelectorAll('[data-gallery-thumb]');
    var main = gallery.querySelector('[data-gallery-main]');
    var idx = 0;

    function activate(i) {
      if (i < 0) i = slides.length - 1;
      if (i >= slides.length) i = 0;
      idx = i;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      thumbs.forEach(function (t, k) { t.classList.toggle('is-initial-selected', k === i); });
      // pause videos not active
      slides.forEach(function (s, k) { var v = s.querySelector('video'); if (v && k !== i) v.pause(); });
    }
    function activateByMedia(id) {
      slides.forEach(function (s, k) { if (String(s.getAttribute('data-media-id')) === String(id)) activate(k); });
    }
    thumbs.forEach(function (t, k) { t.addEventListener('click', function () { activate(k); }); });
    var prev = gallery.querySelector('[data-gallery-prev]');
    var next = gallery.querySelector('[data-gallery-next]');
    if (prev) prev.addEventListener('click', function () { activate(idx - 1); });
    if (next) next.addEventListener('click', function () { activate(idx + 1); });

    // swipe on main
    var sx = 0;
    if (main) {
      main.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
      main.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 40) activate(dx < 0 ? idx + 1 : idx - 1);
      }, { passive: true });
    }

    // zoom
    if (gallery.classList.contains('product-gallery--zoom')) {
      gallery.querySelectorAll('[data-zoom-src]').forEach(function (img) {
        img.addEventListener('click', function () { openZoom(img.getAttribute('data-zoom-src'), img.alt); });
      });
    }
    gallery.__activateByMedia = activateByMedia;
    return gallery;
  }

  function openZoom(src, alt) {
    var overlay = document.createElement('div');
    overlay.className = 'product-zoom-overlay';
    overlay.innerHTML = '<button class="product-zoom-close" aria-label="Close">&times;</button><img src="' + src + '" alt="' + (alt || '') + '">';
    document.body.appendChild(overlay);
    document.documentElement.style.overflow = 'hidden';
    function onEsc(e) { if (e.key === 'Escape') close(); }
    function close() { overlay.remove(); document.documentElement.style.overflow = ''; document.removeEventListener('keydown', onEsc); }
    overlay.addEventListener('click', function (e) { if (e.target === overlay || e.target.classList.contains('product-zoom-close')) close(); });
    document.addEventListener('keydown', onEsc);
  }

  /* ---------------- Variants ---------------- */
  function initVariants(scope) {
    var picker = scope.querySelector('variant-radios');
    if (!picker) return;
    var jsonEl = picker.querySelector('[data-variant-json]');
    if (!jsonEl) return;
    var variants;
    try { variants = JSON.parse(jsonEl.textContent); } catch (e) { return; }
    var form = scope.querySelector('form.shopify-product-form');
    var idInput = scope.querySelector('[data-variant-id-input]');
    var priceEl = scope.querySelector('.product-price-container');
    var addBtn = scope.querySelector('[data-add-button]');
    var addText = scope.querySelector('[data-add-text]');
    var gallery = scope.querySelector('[data-gallery]');

    function selectedOptions() {
      // Index by declared option position so matching never depends on DOM order.
      var opts = [];
      Array.prototype.forEach.call(picker.querySelectorAll('input[type=radio]:checked'), function (r) {
        var pos = parseInt(r.getAttribute('data-option-position'), 10);
        if (pos) opts[pos - 1] = r.value; else opts.push(r.value);
      });
      return opts;
    }
    function match() {
      var opts = selectedOptions();
      return variants.find(function (v) {
        return v.options.length === opts.filter(function (o) { return o != null; }).length &&
          v.options.every(function (o, i) { return o === opts[i]; });
      });
    }
    function money(cents) {
      try { return (window.Shopify && Shopify.formatMoney) ? Shopify.formatMoney(cents, window.moneyFormat) : '₹ ' + (cents / 100).toLocaleString(); }
      catch (e) { return '₹ ' + (cents / 100).toFixed(2); }
    }
    function update() {
      var v = match();
      // reflect active label swatch
      picker.querySelectorAll('.variant-blk').forEach(function (l) {
        var input = l.querySelector('input'); l.classList.toggle('active', input && input.checked);
      });
      picker.querySelectorAll('[data-selected-option]').forEach(function (el, i) {
        var checked = picker.querySelectorAll('input[type=radio]:checked')[i];
        if (checked) el.textContent = checked.value;
      });
      if (!v) {
        if (addBtn) { addBtn.setAttribute('disabled', ''); }
        if (addText) addText.textContent = window.themeStrings.unavailable;
        if (priceEl) priceEl.classList.add('is-unavailable');
        return;
      }
      if (priceEl) priceEl.classList.remove('is-unavailable');
      if (idInput) { idInput.value = v.id; idInput.removeAttribute('disabled'); }
      if (priceEl) {
        var html = '<span class="price' + (v.compare_at_price > v.price ? ' price--on-sale' : '') + '">';
        if (v.compare_at_price > v.price) html += '<del><span class="amount">' + money(v.compare_at_price) + '</span></del>';
        html += '<ins><span class="amount">' + money(v.price) + '</span></ins></span>';
        priceEl.innerHTML = html;
      }
      if (addBtn && addText) {
        if (v.available) { addBtn.removeAttribute('disabled'); addText.textContent = window.themeStrings.addToCart; }
        else { addBtn.setAttribute('disabled', ''); addText.textContent = window.themeStrings.soldOut; }
      }
      updateInventory(scope, v);
      updateSticky(scope, v);
      if (v.featured_media && gallery && gallery.__activateByMedia) gallery.__activateByMedia(v.featured_media.id);
      // update URL
      if (history.replaceState) {
        var url = new URL(window.location.href); url.searchParams.set('variant', v.id); history.replaceState({}, '', url.toString());
      }
    }
    picker.addEventListener('change', update);
  }

  function updateInventory(scope, v) {
    var el = scope.querySelector('[data-inventory]');
    if (!el) return;
    var threshold = parseInt(el.getAttribute('data-threshold'), 10) || 10;
    var qty = (v && typeof v.inventory_quantity === 'number') ? v.inventory_quantity : null;
    var managed = v && v.inventory_management;
    var textEl = el.querySelector('[data-inventory-text]') || el;
    if (managed && v.available && qty !== null && qty > 0 && qty <= threshold) {
      var tpl = (window.themeStrings && window.themeStrings.lowStock) || 'Only [count] left';
      textEl.textContent = tpl.replace('[count]', qty);
      el.classList.remove('is-hidden'); el.classList.add('product-stock--low');
    } else {
      el.classList.add('is-hidden');
    }
  }

  /* ---------------- Sticky mobile add-to-cart ---------------- */
  function updateSticky(scope, v) {
    var bar = document.querySelector('[data-sticky-atc]');
    if (!bar) return;
    var btn = bar.querySelector('[data-sticky-atc-add]');
    var priceEl = bar.querySelector('.product-price-container .price, .sticky-atc__price');
    if (btn) {
      if (v && v.available) { btn.removeAttribute('disabled'); btn.textContent = window.themeStrings.addToCart; }
      else { btn.setAttribute('disabled', ''); btn.textContent = window.themeStrings.soldOut; }
    }
  }
  function initSticky(scope) {
    var bar = document.querySelector('[data-sticky-atc]');
    var realBtn = scope.querySelector('[data-add-button]');
    if (!bar || !realBtn) return;
    var stickyBtn = bar.querySelector('[data-sticky-atc-add]');
    if (stickyBtn) stickyBtn.addEventListener('click', function () { realBtn.click(); });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { bar.classList.toggle('is-visible', !e.isIntersecting); bar.setAttribute('aria-hidden', e.isIntersecting ? 'true' : 'false'); });
      }, { rootMargin: '0px 0px -40% 0px' });
      io.observe(realBtn);
    }
  }

  /* ---------------- Quantity ---------------- */
  function initQty(scope) {
    scope.querySelectorAll('quantity-input').forEach(function (wrap) {
      var input = wrap.querySelector('[data-qty-input]');
      if (!input) return;
      var minus = wrap.querySelector('[data-qty-minus]');
      var plus = wrap.querySelector('[data-qty-plus]');
      var min = parseInt(input.min, 10) || 1;
      var max = input.max ? parseInt(input.max, 10) : Infinity;
      if (minus) minus.addEventListener('click', function () { input.value = Math.max(min, (parseInt(input.value, 10) || min) - 1); });
      if (plus) plus.addEventListener('click', function () { input.value = Math.min(max, (parseInt(input.value, 10) || min) + 1); });
    });
  }

  /* ---------------- Add to cart (AJAX) ---------------- */
  function initForm(scope) {
    var form = scope.querySelector('form.shopify-product-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('[data-add-button]');
      var text = form.querySelector('[data-add-text]');
      if (btn.hasAttribute('disabled')) return;
      var prev = text ? text.textContent : '';
      if (text) text.textContent = '…';
      btn.classList.add('is-loading');
      fetch(root + 'cart/add.js', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(serialize(form))
      }).then(function (r) { return r.json(); }).then(function (res) {
        btn.classList.remove('is-loading');
        if (res.status) {
          // Shopify returns {status, message, description} on error (e.g. out of stock)
          if (text) text.textContent = res.description || res.message || (window.themeStrings && window.themeStrings.unavailable) || prev;
          setTimeout(function () { if (text) text.textContent = prev; }, 2500);
          return;
        }
        if (text) text.textContent = prev;
        document.dispatchEvent(new CustomEvent('cart:refresh', { detail: { open: true } }));
      }).catch(function () { btn.classList.remove('is-loading'); if (text) text.textContent = prev; });
    });
  }
  function serialize(form) {
    var id = form.querySelector('[name=id]').value;
    var qtyEl = form.querySelector('[name=quantity]');
    return { items: [{ id: id, quantity: qtyEl ? parseInt(qtyEl.value, 10) || 1 : 1 }] };
  }

  function boot() {
    document.querySelectorAll('.main-product').forEach(function (scope) {
      initGallery(scope); initVariants(scope); initQty(scope); initForm(scope); initSticky(scope);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
