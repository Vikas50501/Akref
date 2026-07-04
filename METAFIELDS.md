# METAFIELDS.md — AKINNA theme metafield & metaobject setup

> Companion to [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md). This is the single reference
> for every custom-data definition the AKINNA theme reads. Create these in the store
> **once** and the theme's dynamic sources light up automatically in the Theme Editor.
>
> **Last updated:** 2026-07-04 · **Covers phase 9 (Assets & metafields).**

---

## 1. How the theme uses metafields

The theme never *requires* a metafield — every metafield-backed field has a static
Theme-Editor fallback (a `text`/`richtext`/`image_picker` setting). Metafields are the
**scalable** way to enter the same kind of content per product without touching the
Theme Editor for each one.

Two binding styles are used:

| Style | Where | How it resolves |
|---|---|---|
| **Fallback default** | `designer-note.liquid`, `main-product.liquid` (tagline) | `setting \| default: product.metafields.custom.<key>` — the section setting wins if filled, otherwise the metafield is shown. Also connectable via the Theme Editor **"Connect dynamic source"** (⚡) button on that setting. |
| **Key lookup** | `main-product.liquid` accordion block | The merchant types a metafield **key** into the block's *"Row N metafield key"* field; the theme reads `product.metafields.custom[key]`. |

Because the storefront fields are typed `richtext` / `text` / `image_picker`, Shopify's
Theme Editor shows the ⚡ dynamic-source picker on them automatically once the matching
metafield definition exists — no code change needed to bind additional ones.

---

## 2. Product metafields (namespace: `custom`)

Create under **Settings → Custom data → Products → Add definition**.

| Name | Namespace + key | Type | Used by | Notes |
|---|---|---|---|---|
| Tagline | `custom.tagline` | Single line text | `main-product.liquid` → *Tagline* block; `designer-note.liquid` also reads it via ⚡ | Short line under the product title. |
| Designer note | `custom.designer_note` | Rich text | `designer-note.liquid` (quote) | The atelier quote shown with the quotation marks. |
| Description (extra) | `custom.description_extra` | Rich text | `main-product.liquid` → *Accordion* row (type key `description_extra`) | Long-form description if you don't want to use the native product Description. |
| Size | `custom.size` | Rich text | Accordion row (key `size`) | Dimensions / fit. |
| Materials | `custom.materials` | Rich text | Accordion row (key `materials`) | Leather, hardware, lining. |
| Shipping & returns | `custom.shipping_returns` | Rich text | Accordion row (key `shipping_returns`) | Reusable policy copy per product. |
| What fits inside | `custom.what_fits_inside` | Rich text | Optional — bind to `what-fits-inside.liquid` via ⚡ | Bullet list of contents. |

> **Accordion tip:** In the product template's *Product information → Accordion* block,
> each row has a **"Row N metafield key"** field. Type just the key (e.g. `size`) — the
> theme prepends the `custom.` namespace. Leave it blank and type static *Row N content*
> instead to hard-code a row.

### Recommended accordion default mapping
| Row | Title (default) | Suggested metafield key |
|---|---|---|
| 1 | Description | `description_extra` |
| 2 | Size | `size` |
| 3 | Materials | `materials` |
| 4 | Shipping & Returns | `shipping_returns` |
| 5 | *(empty)* | *(any custom key)* |

---

## 3. Variant swatches (native Shopify — no metafield)

Color/finish swatches in the product `variant_picker` use **Shopify's native option
value swatches**, not a metafield:

**Settings → Custom data → *(Products)* → Variant → or Product options** →  edit the
option (e.g. "Colour") → assign a **colour** or **image** swatch to each value.
`main-product.liquid`'s `variant_picker` renders these automatically. No theme change
required.

---

## 4. Collection metafields (optional, namespace `custom`)

Only needed if you want per-collection editorial copy driven by data instead of the
section settings. Create under **Settings → Custom data → Collections**.

| Name | Namespace + key | Type | Bind to |
|---|---|---|---|
| Subtitle | `custom.subtitle` | Single line text | `main-collection.liquid` banner heading area via ⚡ (or use the section's text setting) |
| Banner image | `custom.banner` | File (image) | Collection banner image via ⚡ |

The theme ships with static section settings for these, so they are **optional**.

---

## 5. Page / article metafields (optional)

The `page`, `about`, `sustainability`, `events` templates use section settings for all
content, so no metafields are required. If a merchant prefers data-driven page hero
copy, add `custom.subtitle` (single line) / `custom.hero_image` (file) on **Pages** and
bind via ⚡ on `page-header.liquid`.

---

## 6. Metaobjects (optional — advanced)

The theme's app-equivalent sections (Instagram grid, testimonials, store locator,
events) are built with **repeatable theme blocks**, so metaobjects are **not required**.
They are offered here only for merchants who want to manage that content as structured
records reused across the store.

### 6.1 `instagram_post` (optional)
Powers a data-driven Instagram grid instead of manual image blocks.

| Field | Key | Type |
|---|---|---|
| Image | `image` | File (image) |
| Link | `link` | URL |
| Caption | `caption` | Single line text |

Create at **Settings → Custom data → Metaobjects → Add definition** (name it
`instagram_post`, enable "Storefronts" access). To use it, add a metaobject-list
reference metafield `custom.instagram_posts` on the shop or a page and loop it — this
requires a small edit to `instagram.liquid` (documented inline in that section). The
default manual-image blocks need none of this.

### 6.2 `store_location` (optional)
Structured version of the `store-locator.liquid` blocks.

| Field | Key | Type |
|---|---|---|
| Name | `name` | Single line text |
| Address | `address` | Multi-line text |
| Hours | `hours` | Single line text |
| Map URL | `map_url` | URL |
| Image | `image` | File (image) |

---

## 7. Creating definitions fast (GraphQL)

If you have Admin API access (custom app with `write_metafield_definitions`), you can
create all product definitions in one pass instead of clicking through the UI. Run each
mutation in **Settings → Apps → Develop apps → your app → GraphQL** or via the CLI.

```graphql
mutation CreateAkinnaProductMetafields {
  tagline: metafieldDefinitionCreate(definition: {
    name: "Tagline", namespace: "custom", key: "tagline",
    ownerType: PRODUCT, type: "single_line_text_field"
  }) { createdDefinition { id } userErrors { field message } }

  designerNote: metafieldDefinitionCreate(definition: {
    name: "Designer note", namespace: "custom", key: "designer_note",
    ownerType: PRODUCT, type: "rich_text_field"
  }) { createdDefinition { id } userErrors { field message } }

  descriptionExtra: metafieldDefinitionCreate(definition: {
    name: "Description (extra)", namespace: "custom", key: "description_extra",
    ownerType: PRODUCT, type: "rich_text_field"
  }) { createdDefinition { id } userErrors { field message } }

  size: metafieldDefinitionCreate(definition: {
    name: "Size", namespace: "custom", key: "size",
    ownerType: PRODUCT, type: "rich_text_field"
  }) { createdDefinition { id } userErrors { field message } }

  materials: metafieldDefinitionCreate(definition: {
    name: "Materials", namespace: "custom", key: "materials",
    ownerType: PRODUCT, type: "rich_text_field"
  }) { createdDefinition { id } userErrors { field message } }

  shippingReturns: metafieldDefinitionCreate(definition: {
    name: "Shipping & returns", namespace: "custom", key: "shipping_returns",
    ownerType: PRODUCT, type: "rich_text_field"
  }) { createdDefinition { id } userErrors { field message } }

  whatFits: metafieldDefinitionCreate(definition: {
    name: "What fits inside", namespace: "custom", key: "what_fits_inside",
    ownerType: PRODUCT, type: "rich_text_field"
  }) { createdDefinition { id } userErrors { field message } }
}
```

> After creating each definition, edit it and enable **"Storefronts" access** (if not on
> by default in your API version) so the theme can read it. Any `userErrors` with
> "already taken" simply mean the definition exists — safe to ignore.

---

## 8. Post-setup checklist

- [ ] All 7 product `custom.*` definitions created and **Storefront-visible**.
- [ ] Sample product filled: `tagline`, `designer_note`, at least `size` + `materials`.
- [ ] Product options given native colour/image swatches.
- [ ] (Optional) Collection `custom.subtitle` / `custom.banner`.
- [ ] In the Theme Editor, open a product → confirm the Tagline, Designer note, and
      Accordion rows render from the metafields. Click ⚡ on any content setting to bind
      more.

See [MEDIA_ASSETS.md](MEDIA_ASSETS.md) for the media upload manifest.
