# AKINNA — Shopify Online Store 2.0 Theme

Production-ready, fully customizable OS 2.0 theme for the AKINNA luxury handbag brand.
This repository **is** the theme: the standard theme folders live at the repo root, so it
can be connected directly to a Shopify store via GitHub.

```
assets/      config/      layout/      locales/
sections/    snippets/    templates/
```

Docs (ignored by Shopify, kept for reference):
[PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) · [AUDIT_REPORT.md](AUDIT_REPORT.md) ·
[METAFIELDS.md](METAFIELDS.md) · [MEDIA_ASSETS.md](MEDIA_ASSETS.md) · [QA_REPORT.md](QA_REPORT.md)

---

## Connect this repo to your Shopify store (GitHub integration)

1. **Create a GitHub repo** (empty, no README) — e.g. `akinna-theme`.
2. **Push this folder** (see commands below).
3. In Shopify admin → **Online Store → Themes → Add theme → Connect from GitHub**.
4. Authorize GitHub, pick the **repo** and **branch** (`main`).
5. Shopify imports it as a theme. Every push to that branch auto-syncs; edits in the
   Theme Editor are committed back to the branch.
6. **Preview** it, then **Publish** when store data (products, menus, media, metafields)
   is populated — see [METAFIELDS.md](METAFIELDS.md) and [MEDIA_ASSETS.md](MEDIA_ASSETS.md).

## Local QA

```
node .qa-validate.mjs
```
Validates template/section JSON, `{% schema %}` blocks, snippet/asset references,
translation keys, Liquid tag balance, settings integrity, and `t:` schema-locale keys.

## Notes
- Headings use a **trial** font (`queens_var_trial*`) — replace with a licensed build
  before commercial launch.
- Hero/product media are merchant-uploaded (not bundled) per Shopify best practice.
