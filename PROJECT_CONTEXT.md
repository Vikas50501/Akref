# PROJECT_CONTEXT.md — AKINNA Shopify Theme

> **Single source of truth.** This document lets any developer, team member, or AI
> model read it once and continue the project seamlessly from the exact point work
> stopped — no prior context required.
>
> **Last updated:** 2026-07-04
> **Status:** ~99% complete — enterprise audit remediation done. Launch readiness
> **68 → 92/100**. All Critical/High findings, all Theme-Store blockers (`@app` blocks,
> `t:` schema locale keys + `en.default.schema.json`), and most Medium/Low resolved.
> New premium features: mobile sticky ATC, stock-urgency, card colour swatches, cart
> upsell, recently-viewed, country/currency/language selector, richer settings. Validated
> by `.qa-validate.mjs` (**1184 checks, 0 errors**). See [AUDIT_REPORT.md](AUDIT_REPORT.md).
> Remaining: live-store QA (Lighthouse/AJAX/checkout/cross-browser) + trial-font swap.
>
> _(prior status)_ ~97% complete — all templates, sections, and global chrome built.
> **Phase 9 (Assets & metafields) done:** metafield/metaobject definitions
> ([METAFIELDS.md](METAFIELDS.md)), media manifest + upload guide
> ([MEDIA_ASSETS.md](MEDIA_ASSETS.md)), dynamic sources verified. **Phase 10 (QA) done
> (static):** `.qa-validate.mjs` = **587 checks, 0 errors** (JSON, section/block types,
> snippet/asset refs, translation keys, Liquid tag balance, settings integrity); perf +
> a11y audit with fixes — see [QA_REPORT.md](QA_REPORT.md). Remaining: in-store data
> entry (menus/metafields/media per the docs), optional locale schema, **live QA on a
> Shopify dev store** (Theme Check, Lighthouse, AJAX/responsive), trial-font swap.

---

## 1. Project goals & vision

Recreate the existing **akinna.com** website — a premium luxury handbag brand
("AKINNA", by designer Annika Saraf, handcrafted in India) — as a **fully functional,
production-ready Shopify Online Store 2.0 theme**.

Requirements (from the client brief):
- **Pixel-perfect** replication of the original site's design, layout, typography,
  spacing, animations, and responsive behavior.
- Built on **Shopify OS 2.0** architecture: JSON templates, sections, blocks,
  snippets, settings, metafields, dynamic sources, app-block support.
- **A-to-Z customizability** through the Theme Editor — every section editable with no
  code (colors, typography, spacing, layout, content, visibility, responsive,
  animation controls).
- All standard store pages: home, collection (+ filtering/sorting), product, cart,
  search, blog, article, about, contact, FAQ, policies, customer account, 404,
  custom landing pages.
- Clean, modular, maintainable, scalable, performance-optimized (Core Web Vitals,
  lazy-loading, deferred JS, preloaded fonts), accessible (WCAG), SEO-friendly.

### Source material
The starting point was an **HTTrack static backup** of the live site
(`Akina final.zip`, 81 MB) — the original site is itself a Shopify store running a
customized third-party theme (class names like `thb-`, `.flickity-*` suggest a
"Kalles"-family theme). We rebuilt it **from scratch** as a clean OS 2.0 theme rather
than copying the compiled theme, reproducing structure/design faithfully while making
everything editable.

Extracted backup location (reference only, not shipped):
`C:\Users\yavis\OneDrive\Desktop\Shopify\Akina\_httrack_extract\Akina final\www.akinna.com\`

---

## 2. Design system (extracted from the original)

| Token | Value | Usage |
|---|---|---|
| Brand green | `#0e3432` | Announcement bar, footer, dark sections, buttons |
| Ink (text) | `#141515` | Body text on light |
| Background | `#ffffff` | Page background |
| Alt background | `#f5f3f5` | Cards, media placeholders |
| Link hover | `#3a6662` | Hover state |
| Borders | `rgba(20,21,21,.10)` / `rgba(255,255,255,.10)` | Hairlines |

**Fonts (bundled `.woff2`, defined in `snippets/font-face.liquid`):**
- Headings: `queens_var_triallight` (serif, variable 100–800) — **⚠ TRIAL LICENSE.
  Must be replaced with a licensed build before commercial launch.**
- Body/UI: `centra_no2book`, `suisse_intlregular/medium/bold/book/light/ultralight`
- Accent: `panamaregular`; plus `queenregular/semi-bold/bold/black` variants.

**Motifs reproduced:** parallax + scale-on-scroll (custom JS replacing GSAP),
`letters-slide-up` split-word heading reveals, Swiper-style carousels (custom
dependency-free), hover image-swap product cards, marquee tickers.

---

## 3. Decisions made (defaults chosen; brief's questions went unanswered)

1. **Assets:** Custom fonts downloaded from the live CDN and **bundled**. Brand/press
   logos and product-feature icons downloaded and bundled (`assets/brand_*`). Large
   hero/lifestyle images and videos are **merchant-uploaded via section settings**
   (Shopify best practice + asset size limits) rather than hard-bundled.
2. **Third-party apps → native theme equivalents** (no paid-app dependency):
   - Instagram feed (Instafeed app) → native `instagram.liquid` manual-image grid.
   - WhatsApp chat → configurable floating button (theme setting).
   - GoKwik express checkout → standard Shopify cart/checkout + dynamic checkout button.
   - Lookfy / post-purchase upsell → omitted (install as apps if needed; app-block
     regions supported by OS 2.0 automatically).
3. **Localization:** English (`locales/en.default.json`) with translatable strings
   throughout, so FR/IT can be added via **Translate & Adapt** without code changes.
   (Original site had /fr and /it — not hand-translated.)

---

## 4. Technical architecture

- **Platform:** Shopify Online Store 2.0 (JSON templates + section groups).
- **CSS:** Design tokens as CSS custom properties in `assets/base.css` fed by
  `settings_schema` global settings. Shared component CSS files loaded in
  `layout/theme.liquid`; **template-specific CSS loaded conditionally** by
  `request.page_type`; **section-specific CSS colocated** in each section via
  `{% stylesheet %}`. Dynamic per-section styles via `{% style %}` + `section.id`.
- **JS:** Vanilla, dependency-free, `defer`-loaded. No jQuery/GSAP/Swiper runtime deps.
  IntersectionObserver for lazyload/reveal/parallax. Custom elements
  (`<product-form>`, `<variant-radios>`, `<predictive-search>`, `<quantity-input>`,
  `<product-recommendations>`).
- **Cart:** AJAX drawer (default) or cart page (setting `cart_type`), with live
  section re-render via `?section_id=cart-drawer-render`.
- **Search:** Predictive search (Shopify Search & Suggest API) + full results page.
- **Filtering:** Native Shopify `collection.filters` (facets) with AJAX + history API
  (`assets/collection.js`), price range + checkbox facets, sort dropdown.

### Performance
Preloaded key fonts (`font-display:swap`), lazy images with responsive `srcset`,
deferred scripts, conditional CSS, `prefers-reduced-motion` fully honored, CLS-safe
aspect-ratio boxes.

### Accessibility
Skip link, ARIA labels on icon buttons, focus management in drawers/modals, keyboard
Escape-to-close, `aria-hidden` toggling, semantic headings, reduced-motion support.

---

## 5. File structure & purpose

```
akinna-theme/
├── layout/
│   ├── theme.liquid          Main layout: head, font-face, CSS/JS loading (global +
│   │                         conditional per page_type), header/footer section groups,
│   │                         cart drawer, search modal, WhatsApp float, JS globals.
│   └── password.liquid       Storefront password-page layout.
├── config/
│   ├── settings_schema.json  GLOBAL theme settings: Colors, Typography, Layout,
│   │                         Buttons/corners, Product cards, Animations, Cart,
│   │                         Social/contact, WhatsApp, Branding (logos/favicon).
│   └── settings_data.json    Default values + "Akinna" preset.
├── templates/                JSON templates wiring sections per page:
│   ├── index.json            Home: hero→ticker→products→founder→atelier video→new
│   │                         arrivals→separator→material→green→testimonials→club→
│   │                         press logos→instagram.
│   ├── product.json          main-product + designer-note + what-fits-inside +
│   │                         elements carousel + video banner + icon grid + feature
│   │                         carousel + recommendations.
│   ├── collection.json       Product grid (facets/sort) + designer note (disabled) +
│   │                         icon grid.
│   ├── list-collections.json / cart.json / search.json / blog.json / article.json /
│   │   page.json / page.about.json / page.contact.json / page.events.json /
│   │   page.store.json / page.sustainability.json / 404.json / password.json
│   └── customers/            login, register, account, order, addresses,
│                             reset_password, activate_account (Liquid templates).
├── sections/                 38 sections + 2 JSON groups (header-group, footer-group).
├── snippets/                 13 reusable partials (see §6).
├── assets/                   14 fonts (.woff2), 11 CSS, 7 JS, 10 brand images.
└── locales/                  en.default.json (UI strings).
```

### Sections inventory (schema name → file)
**Global chrome:** Announcement bar, Header (mega-menus/dropdowns/mobile), Footer,
Cart drawer render, Predictive search.
**Homepage:** Hero slideshow, Ticker, Product carousel, Image with text (founder +
material), Background video, Collection showcase, Separator, Brand feature (Akinna
Green), Testimonials media, Club banner, Logo marquee, Instagram.
**Product:** Product information (main), Designer note, What fits inside, Media
carousel (elements/features), Video banner, Icon grid (symbols), Product
recommendations.
**Collection/list:** Product grid, List collections.
**Pages/content:** Page content, Rich text, Page header, Contact form, Store locator,
Events.
**Blog:** Blog posts, Article.
**Utility:** Cart, Search, 404, Password.

### Snippets inventory
`font-face`, `icon` (inline SVG library), `responsive-image`, `price`, `product-card`
(hover-swap + quick add), `product-media-gallery`, `mega-menu`, `cart-drawer`,
`cart-contents` (shared drawer/page), `search-modal`, `article-card`, `meta-tags`
(OG/Twitter + JSON-LD hook), `structured-data-product` (Product schema).

### Asset inventory
- **CSS:** `base.css` (tokens/reset/type/buttons/utilities), `animations.css`,
  `product-card.css`, `sections.css` (shared section primitives + carousel arrows +
  placeholder), `component-header.css`, `component-footer.css`, `component-cart.css`,
  `component-product.css`, `component-collection.css`, `component-blog.css`,
  `component-customer.css`.
- **JS:** `global.js` (lazyload, reveal, split-text, parallax, accordions, quick-add),
  `carousel.js` (native slider), `component-header.js` (sticky/transparent, drawers,
  modals), `cart.js` (AJAX cart), `product.js` (variants, gallery, qty, ATC),
  `collection.js` (AJAX facets/sort), `predictive-search.js`.
- **Images:** `brand_akinna_logo_black.png`, `brand_akinna_logo_white.png`, and
  product-feature icons (`brand_Akinna_Logo_Hardware.webp`, `brand_Green_interiors.webp`,
  `brand_LWG_Certification.webp`, `brand_Signature_Panelling_1.webp`, `brand_Frame_66/76/78`,
  `brand_Designed_in_India.png`).

---

## 6. Customization model (how merchants edit)

- **Global** (`settings_schema.json`): brand colors, type scale, container width,
  gutters, button/global radius, product-card ratio + quick-add, animation toggles,
  cart behavior + free-shipping bar/threshold, social links, WhatsApp, logos, favicon.
- **Per section:** every section exposes color, spacing (padding top/bottom), layout
  (columns, image position, heights), content, and (where relevant) animation and
  aspect-ratio controls, plus **blocks** for repeatable content (slides, items,
  columns, logos, stores, events, accordion rows, mega-menu promos).
- **Dynamic sources / metafields:** product tagline, designer note, and accordion rows
  (Description/Size/Materials) can pull from product metafields (`custom.*`); wired in
  `main-product.liquid` and `designer-note.liquid`.

### Navigation menus expected (create in Shopify admin → Navigation)
`main-menu` (header), `footer-category`, `footer-services`, `footer-about`,
`footer-legal`. Mega-menu promos map to a top-level item by exact title via the
header's `mega_promo` blocks (e.g. "Shop By Category", "Shop By Collection").

### Metafields to create (Shopify admin → Settings → Custom data → Products)
- `custom.tagline` (single line) — product tagline under title.
- `custom.designer_note` (rich text) — designer note quote.
- `custom.description_extra`, `custom.size`, `custom.materials` (rich text) — accordion
  rows. (Accordion also accepts static content per row as a fallback.)
Variant color swatches use Shopify's native swatch feature (option values with
color/image swatches) — `variant_picker` renders them automatically.

---

## 7. What is completed

- ✅ Full theme scaffold, layout, global CSS tokens, 14 bundled fonts, font-face.
- ✅ Global chrome: announcement bar, header (centered logo, dropdown + mega-menu,
  transparent-over-hero → solid on scroll, mobile drawer), footer (menu columns,
  newsletter, payment icons, social, copyright), cart drawer, search modal, WhatsApp.
- ✅ Homepage: all ~13 sections + `index.json` wired to original content/order.
- ✅ Product: main (gallery w/ thumbnails+zoom+video, variant swatches, AJAX ATC,
  trust badges, metafield accordions, share) + 7 supporting sections + `product.json`.
- ✅ Collection: grid + AJAX facets/sort + pagination + `collection.json`;
  `list-collections`.
- ✅ Cart (drawer + page, free-shipping bar), Search (predictive + results).
- ✅ Secondary pages: page, about, contact (form), events, store locator,
  sustainability, blog list, article, policies (styled via `.rte`), 404, password.
- ✅ Customer account: login/recover, register, account, order, addresses,
  reset_password, activate_account.
- ✅ 10 brand images bundled; `en.default.json` locale; JSON + all section schemas
  validated (0 errors); no missing snippet/asset references.
- ✅ **Phase 9 — Assets & metafields:** [METAFIELDS.md](METAFIELDS.md) (7 product
  `custom.*` definitions + optional collection/page metafields + optional metaobjects,
  with admin steps and a GraphQL creation appendix); [MEDIA_ASSETS.md](MEDIA_ASSETS.md)
  (source→section media manifest + upload guide, honoring the merchant-upload policy for
  large media/video); dynamic-source wiring verified (tagline, designer note, accordion
  keys — all guarded, ⚡-bindable in the Theme Editor).
- ✅ **Phase 10 — QA (static):** `.qa-validate.mjs` (run `node .qa-validate.mjs`) — 587
  checks covering template/group/config/locale JSON, section & block-type resolution,
  snippet/asset references, `| t` translation keys, Liquid tag balance, and settings
  integrity — all pass. Performance + accessibility audit done; fixes applied (font
  preload, password-page `aria-label`s). Full results in [QA_REPORT.md](QA_REPORT.md).

---

## 8. Pending tasks & remaining milestones (START HERE to continue)

1. **Upload media (per [MEDIA_ASSETS.md](MEDIA_ASSETS.md)):** hero desktop+mobile
   banners, founder/material/green/club images, product gallery images, testimonial +
   atelier videos. Section→source mapping and the merchant-upload policy are now fully
   documented in MEDIA_ASSETS.md (large media/video stays merchant-uploaded by design).
   Source files: `..\_httrack_extract\...\cdn\shop\{files,videos}\` or the live CDN.
2. **Create in Shopify admin:** navigation menus (§6); product metafield definitions
   per [METAFIELDS.md](METAFIELDS.md) (UI steps + GraphQL appendix); then upload logos
   in Theme Settings → Branding.
3. **Optional:** `locales/en.default.schema.json` (Theme Editor label translations);
   FR/IT locale files or Translate & Adapt.
4. **Live QA on a dev store** (`shopify theme dev`): render every template, confirm no
   Liquid errors, run Theme Check, verify AJAX cart/filter/search, responsive passes at
   375/768/1440, Lighthouse/Core Web Vitals, cross-browser.
5. **Font license:** replace trial `queens_var_trial*` with a licensed build.
6. **Package:** zip the `akinna-theme/` folder for upload (Online Store → Themes →
   Upload), or `shopify theme push`.

---

## 9. Challenges & resolutions

- **Fonts/images not in HTTrack backup** (they live on Shopify CDN) → downloaded fonts
  + key brand icons via `curl` from the live CDN; confirmed HTTP 200.
- **Original CSS heavily minified/no newlines** → parsed `@font-face` and tokens with
  Python to reproduce type/colors accurately.
- **Cross-section CSS dependency** (`.carousel-arrow` used by several carousels but
  colocated in one section) → moved shared carousel primitives to always-loaded
  `sections.css`.
- **No GSAP/Swiper/jQuery** (original used them) → rebuilt parallax, scale-on-scroll,
  split-text, and carousels as small dependency-free vanilla JS for performance.
- **Theme can't render in a local static preview** (needs Shopify to compile Liquid) →
  validated structurally (JSON/schema parse, reference integrity) and against the
  HTTrack reference visually; live QA deferred to a Shopify dev store (§8.4).

---

## 10. Business logic, workflows & rules

- **Currency:** original store in INR (₹); theme uses `shop.money_format` — currency-agnostic.
- **Add to cart:** AJAX → opens cart drawer (unless `cart_type=page`). Quick-add on
  cards adds first/only variant; multi-variant cards link to product page.
- **Free shipping bar:** threshold in `settings.cart_free_shipping_threshold` (major
  units); progress computed against `cart.total_price`.
- **Variant selection:** client-side match against embedded variant JSON; updates
  price, availability, ATC state, gallery (featured media), and URL `?variant=`.
- **Filtering/sort:** AJAX, pushes state to history; "Clear" resets to collection URL.

## 11. Assumptions, dependencies, known limitations

- **Assumptions:** merchant sets up menus + metafields + swatches; products/collections
  populate the section content that currently shows placeholders.
- **Dependencies:** none at runtime (no external JS/CSS libs). Shopify APIs used:
  cart, predictive search, section rendering, product recommendations, filters.
- **Limitations:** hero/product media not pre-bundled (merchant uploads); FR/IT not
  translated; trial heading font; app-driven features (GoKwik, Lookfy) intentionally
  not reimplemented.

## 12. Reference paths

- Theme (deliverable): `C:\Users\yavis\OneDrive\Desktop\Shopify\Akina\akinna-theme\`
- Build plan: `..\THEME_BUILD_PLAN.md`
- HTTrack reference: `..\_httrack_extract\Akina final\www.akinna.com\`
- Live site: https://www.akinna.com
