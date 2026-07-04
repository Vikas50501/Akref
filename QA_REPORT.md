# QA_REPORT.md — AKINNA theme (Phase 10)

> Companion to [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md). Records the static QA pass
> performed without a Shopify runtime, plus the checklist for live QA on a dev store.
>
> **Last updated:** 2026-07-04 · **Phase 10 (QA).**

---

## 1. Automated static QA — `node .qa-validate.mjs`

**Result: ✅ PASS — 1184 checks, 0 errors, 0 warnings** (expanded after remediation to
also validate `t:` schema-locale keys resolve in `en.default.schema.json`).

| Check | What it verifies | Status |
|---|---|---|
| JSON parse | All template, section-group, config, and locale JSON parse | ✅ |
| Section `{% schema %}` | Every section's embedded schema is valid JSON | ✅ |
| Section types | Every `type` in template/group JSON resolves to `sections/<type>.liquid` | ✅ |
| Block types | Every block `type` in template JSON is declared in that section's schema (or `@app`/theme block) | ✅ |
| Snippet refs | Every `{% render/include 'x' %}` resolves to `snippets/x.liquid` | ✅ |
| Asset refs | Every `'x' \| asset_url` resolves to a file in `assets/` | ✅ |
| Translation keys | Every `'key' \| t` resolves in `locales/en.default.json` | ✅ |
| Liquid tag balance | `if/for/case/form/paginate/capture/style/stylesheet/javascript/schema/...` open==close per file | ✅ |
| Settings integrity | `settings_data.json` current keys resolve to `settings_schema.json` ids | ✅ |
| Schema locale keys | Every `t:` label resolves in `en.default.schema.json` (560 keys) | ✅ |

Re-run any time with `node .qa-validate.mjs` (exit code 0 = pass). No dependencies.

---

## 2. Performance audit (static)

| Item | Finding | Action |
|---|---|---|
| Deferred JS | All `<script src>` use `defer`/`script_tag` — no render-blocking JS | ✅ pass |
| Font-display | All `@font-face` use `font-display:swap` | ✅ pass |
| **Font preload** | `font-face.liquid` already preloads the two correct critical fonts (`queensvartrial` serif + `centra_no_2_book` body). A brief erroneous edit that duplicated the serif and preloaded the wrong body font (`suisse_intl_regular` = UI font) was **reverted** | ✅ correct as shipped |
| CSS strategy | Global CSS shared; template CSS conditional by `page_type`; section CSS colocated | ✅ pass |
| Image loading | Content images lazy with `srcset`; above-the-fold logos correctly default-eager (not lazy) → protects LCP | ✅ pass |
| CLS | `width`/`height` on images; aspect-ratio boxes | ✅ pass |
| `prefers-reduced-motion` | Honored in `base.css`, `animations.css`, `global.js` | ✅ pass |

---

## 3. Accessibility audit (static)

| Item | Finding | Action |
|---|---|---|
| Skip link | `skip-to-content` present in `theme.liquid` | ✅ pass |
| Image alt | All content `<img>` have an `alt` attribute | ✅ pass |
| Icon buttons | 2 icon-only submit buttons on the password page lacked labels | ✅ **fixed** — added `aria-label` (newsletter + password-login); added `general.password_page.login_button` locale key |
| Drawer/modal focus | Focus management + Escape-to-close in `component-header.js` | ✅ pass (verify live) |
| ARIA state | `aria-expanded` on accordions/menus | ✅ pass |

---

## 4. Fixes applied this pass

1. `sections/main-password.liquid` — `aria-label` on both icon-only submit buttons.
3. `locales/en.default.json` — added `general.password_page.login_button`.
4. `.qa-validate.mjs` — extended from 187 → 587 checks (translation keys, tag balance,
   block-type resolution, settings integrity).

---

## 5. Remaining: live QA on a Shopify dev store (cannot be done offline)

Liquid must be compiled by Shopify; a static preview can't render it. Run these once the
theme is pushed (`shopify theme dev` / `shopify theme push`):

- [ ] `shopify theme check` — official linter (catches deprecations the static harness can't).
- [ ] Render every template with real products/collections; confirm no Liquid errors.
- [ ] AJAX flows: add-to-cart + drawer, quantity update, cart page, free-shipping bar.
- [ ] Collection filters + sort (AJAX + history/back button), "Clear all".
- [ ] Predictive search + full results page.
- [ ] Variant selection: price/availability/gallery/URL update; native swatches.
- [ ] Responsive passes at **375 / 768 / 1440**; header transparent→solid on scroll; mobile drawer.
- [ ] Lighthouse / Core Web Vitals (LCP, CLS, INP); confirm font preload effect.
- [ ] Cross-browser: Chrome, Safari, Firefox, mobile Safari.
- [ ] Metafields/menus/media populated per [METAFIELDS.md](METAFIELDS.md) + [MEDIA_ASSETS.md](MEDIA_ASSETS.md).
- [ ] Replace trial `queens_var_trial*` font with a licensed build before launch.
