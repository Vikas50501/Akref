/* AKINNA — Product carousel engine (used by sections/product-carousel.liquid only).
   Page-stepping model: "page" = one screenful of `perView` slides. Loop wraps by
   cloning one extra page at each end and snapping back without a transition once the
   clone finishes its transition — the standard seamless-loop trick. */
(function () {
  'use strict';
  if (customElements.get('product-carousel')) return;

  var BP_TABLET = 1023, BP_MOBILE = 767;

  customElements.define('product-carousel', class extends HTMLElement {
    connectedCallback() {
      if (this.__init) return;
      this.__init = true;
      this.opts = JSON.parse(this.getAttribute('data-options') || '{}');
      this.viewport = this.querySelector('[data-pc-viewport]');
      this.track = this.querySelector('[data-pc-track]');
      this.prevBtn = this.querySelector('[data-pc-prev]');
      this.nextBtn = this.querySelector('[data-pc-next]');
      this.dotsEl = this.querySelector('[data-pc-dots]');
      this.progressFill = this.querySelector('[data-pc-progress-fill]');
      this.scrollbar = this.querySelector('[data-pc-scrollbar]');
      this.scrollThumb = this.querySelector('[data-pc-scrollbar-thumb]');
      if (!this.track) return;

      this.reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.originalSlides = Array.prototype.slice.call(this.track.children);
      this.page = 0;
      this.autoTimer = null;
      this.wheelLock = false;

      this.setAttribute('tabindex', '0');
      this.setAttribute('role', 'region');
      this.setAttribute('aria-roledescription', 'carousel');

      this.bindEvents();
      this.build();
      if (this.opts.autoplay && !this.reduce) this.startAuto();
      window.addEventListener('resize', this.debounce(this.build.bind(this), 150));
    }

    perView() {
      var w = window.innerWidth;
      if (w <= BP_MOBILE) return this.opts.perView.mobile;
      if (w <= BP_TABLET) return this.opts.perView.tablet;
      return this.opts.perView.desktop;
    }
    gapFor() {
      var w = window.innerWidth;
      if (w <= BP_MOBILE) return this.opts.gap.mobile;
      if (w <= BP_TABLET) return this.opts.gap.tablet;
      return this.opts.gap.desktop;
    }

    groupIntoColumns(slides, rows) {
      if (rows <= 1) return slides.map(function (s) { return [s]; });
      var cols = [];
      for (var i = 0; i < slides.length; i += rows) cols.push(slides.slice(i, i + rows));
      return cols;
    }

    build() {
      var pv = this.perView();
      var rows = Math.max(1, this.opts.rows || 1);
      this.pv = pv;
      var columns = this.groupIntoColumns(this.originalSlides, rows);
      this.realPageCount = Math.max(1, Math.ceil(columns.length / pv));
      this.pagesData = [];
      for (var p = 0; p < this.realPageCount; p++) this.pagesData.push(columns.slice(p * pv, p * pv + pv));

      this.fade = this.opts.animation === 'fade';
      this.loop = !!this.opts.loop && this.realPageCount > 1;
      this.track.innerHTML = '';
      this.track.classList.toggle('pc__track--fade', this.fade);
      /* Fade needs no DOM clones: wrapping is a plain modulo swap, no transitionend hook. */
      var useClones = this.loop && !this.fade;

      var renderPage = function (cols, gap) {
        var pageEl = document.createElement('div');
        pageEl.className = 'pc__page';
        pageEl.style.setProperty('--pc-gap', gap + 'px');
        pageEl.style.setProperty('--pc-pv', pv);
        cols.forEach(function (col) {
          var colEl;
          if (col.length > 1) {
            colEl = document.createElement('div');
            colEl.className = 'pc__col';
            col.forEach(function (s) { colEl.appendChild(s); });
          } else {
            colEl = col[0];
          }
          colEl.classList.add('pc__slot');
          pageEl.appendChild(colEl);
        });
        return pageEl;
      };

      var gap = this.gapFor();
      /* Build real pages first (this MOVES each original slide node via appendChild).
         Loop clones must be .cloneNode(true) copies taken AFTER that, never a second
         renderPage() over the same source nodes — that would move them again and
         leave the real page empty. */
      var pages = this.pagesData.map(function (cols) { return renderPage(cols, gap); });

      if (useClones) {
        var cloneFirst = pages[0].cloneNode(true);
        var cloneLast = pages[pages.length - 1].cloneNode(true);
        this.track.appendChild(cloneLast);
        pages.forEach(function (p) { this.track.appendChild(p); }, this);
        this.track.appendChild(cloneFirst);
        this.domOffset = 1;
      } else {
        pages.forEach(function (p) { this.track.appendChild(p); }, this);
        this.domOffset = 0;
      }
      this.pageEls = Array.prototype.slice.call(this.track.children);

      this.buildDots();
      this.page = Math.min(this.page, this.realPageCount - 1);
      this.goTo(this.page, true);
    }

    buildDots() {
      if (!this.dotsEl) return;
      this.dotsEl.innerHTML = '';
      if (this.realPageCount <= 1) return;
      for (var i = 0; i < this.realPageCount; i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'pc__dot';
        b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        b.addEventListener('click', this.go.bind(this, i));
        this.dotsEl.appendChild(b);
      }
    }

    domIndex(realPage) { return realPage + this.domOffset; }

    setTransform(domIdx, animate) {
      this.track.style.transition = animate && !this.reduce ? 'transform ' + this.opts.speed + 'ms ' + this.opts.easing : 'none';
      if (this.fade) {
        this.pageEls.forEach(function (p, i) {
          if (i === domIdx) { p.style.display = ''; p.classList.remove('is-active'); void p.offsetWidth; p.classList.add('is-active'); }
          else { p.classList.remove('is-active'); p.style.display = 'none'; }
        });
      } else {
        this.track.style.transform = 'translateX(-' + (domIdx * 100) + '%)';
      }
    }

    goTo(realPage, instant) {
      this.page = realPage;
      this.setTransform(this.domIndex(realPage), !instant);
      this.paintUI();
    }

    go(realPage) {
      if (realPage < 0 || realPage >= this.realPageCount) return;
      this.goTo(realPage);
      this.resetAuto();
    }

    next() {
      if (this.page < this.realPageCount - 1) return this.go(this.page + 1);
      if (this.fade && this.loop) { this.go(0); return; }
      if (this.loop) { this.goTo(this.realPageCount, false); this.pendingWrap = 0; return this.resetAuto(); }
      if (this.opts.rewind) { this.resetAuto(); return this.instantJump(0); }
    }
    prev() {
      if (this.page > 0) return this.go(this.page - 1);
      if (this.fade && this.loop) { this.go(this.realPageCount - 1); return; }
      if (this.loop) { this.goTo(-1, false); this.pendingWrap = this.realPageCount - 1; return this.resetAuto(); }
      if (this.opts.rewind) { this.resetAuto(); return this.instantJump(this.realPageCount - 1); }
    }
    instantJump(realPage) {
      var self = this;
      this.track.style.transition = 'none';
      requestAnimationFrame(function () { self.goTo(realPage, true); });
    }

    paintUI() {
      if (this.prevBtn) this.prevBtn.toggleAttribute('disabled', !this.loop && !this.opts.rewind && this.page <= 0);
      if (this.nextBtn) this.nextBtn.toggleAttribute('disabled', !this.loop && !this.opts.rewind && this.page >= this.realPageCount - 1);
      if (this.dotsEl) {
        Array.prototype.forEach.call(this.dotsEl.children, function (d, i) { d.classList.toggle('is-active', i === this.page); }, this);
      }
      if (this.scrollThumb && this.realPageCount > 1) {
        var w = 100 / this.realPageCount;
        this.scrollThumb.style.width = w + '%';
        this.scrollThumb.style.left = (this.page * (100 - w) / Math.max(1, this.realPageCount - 1)) + '%';
      }
    }

    startAuto() {
      var self = this;
      this.stopAuto();
      if (this.progressFill) { this.progressFill.style.transition = 'none'; this.progressFill.style.width = '0%'; }
      requestAnimationFrame(function () {
        if (self.progressFill) { self.progressFill.style.transition = 'width ' + self.opts.autoplaySpeed + 'ms linear'; self.progressFill.style.width = '100%'; }
      });
      this.autoTimer = setInterval(function () {
        if (document.hidden) return;
        self.next();
      }, this.opts.autoplaySpeed);
    }
    stopAuto() { if (this.autoTimer) { clearInterval(this.autoTimer); this.autoTimer = null; } if (this.progressFill) this.progressFill.style.transition = 'none'; }
    resetAuto() { if (this.opts.autoplay && !this.reduce) this.startAuto(); }

    debounce(fn, ms) { var t; return function () { clearTimeout(t); var a = arguments; t = setTimeout(function () { fn.apply(null, a); }, ms); }; }

    bindEvents() {
      var self = this;
      if (this.prevBtn) this.prevBtn.addEventListener('click', function () { self.prev(); });
      if (this.nextBtn) this.nextBtn.addEventListener('click', function () { self.next(); });

      this.track.addEventListener('transitionend', function (e) {
        if (e.target !== self.track) return;
        if (self.page >= self.realPageCount) self.instantJump(0);
        else if (self.page < 0) self.instantJump(self.pendingWrap || self.realPageCount - 1);
      });

      if (this.opts.hoverPause) {
        this.addEventListener('pointerenter', function () { self.stopAuto(); });
        this.addEventListener('pointerleave', function () { self.resetAuto(); });
        this.addEventListener('focusin', function () { self.stopAuto(); });
        this.addEventListener('focusout', function () { self.resetAuto(); });
      }

      if (this.opts.keyboard) {
        this.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight') { e.preventDefault(); self.next(); self.resetAuto(); }
          else if (e.key === 'ArrowLeft') { e.preventDefault(); self.prev(); self.resetAuto(); }
        });
      }

      if (this.opts.wheel) {
        this.addEventListener('wheel', function (e) {
          var delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
          if (Math.abs(delta) < 20 || self.wheelLock) return;
          e.preventDefault();
          self.wheelLock = true;
          if (delta > 0) self.next(); else self.prev();
          self.resetAuto();
          setTimeout(function () { self.wheelLock = false; }, 400);
        }, { passive: false });
      }

      if (this.opts.drag) {
        var startX = 0, dragging = false, dragged = false, baseDomIdx = 0;
        var vw = function () { return self.viewport.getBoundingClientRect().width; };
        this.viewport.addEventListener('pointerdown', function (e) {
          if (e.target.closest('a,button,input,textarea')) return;
          dragging = true; dragged = false; startX = e.clientX;
          baseDomIdx = self.domIndex(self.page);
          self.track.style.transition = 'none';
          self.viewport.setPointerCapture(e.pointerId);
          self.stopAuto();
        });
        this.viewport.addEventListener('pointermove', function (e) {
          if (!dragging) return;
          var dx = e.clientX - startX;
          if (Math.abs(dx) > 4) dragged = true;
          if (self.fade) return;
          self.track.style.transform = 'translateX(calc(-' + (baseDomIdx * 100) + '% + ' + dx + 'px))';
        });
        this.viewport.addEventListener('pointerup', function (e) {
          if (!dragging) return;
          dragging = false;
          var dx = e.clientX - startX;
          if (Math.abs(dx) > vw() * 0.15) {
            if (dx < 0) self.next(); else self.prev();
          } else if (!self.fade) {
            self.goTo(self.page, true);
          }
          self.resetAuto();
        });
        this.track.addEventListener('click', function (e) { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }, true);
      }

      if (this.scrollbar) {
        this.scrollbar.addEventListener('pointerdown', function (e) {
          var seek = function (evt) {
            var rect = self.scrollbar.getBoundingClientRect();
            var pct = Math.min(1, Math.max(0, (evt.clientX - rect.left) / rect.width));
            self.go(Math.round(pct * (self.realPageCount - 1)));
          };
          seek(e);
          var move = function (evt) { seek(evt); };
          var up = function () { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); };
          document.addEventListener('pointermove', move);
          document.addEventListener('pointerup', up);
        });
      }
    }
  });

  /* Quick-view dialogs: native <dialog>, opened/closed by delegated clicks. */
  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-quickview-open]');
    if (opener) {
      var dlg = document.getElementById(opener.getAttribute('data-quickview-open'));
      if (dlg && dlg.showModal) dlg.showModal();
      return;
    }
    var closer = e.target.closest('[data-quickview-close]');
    if (closer) { var d = closer.closest('dialog'); if (d) d.close(); }
  });
})();
