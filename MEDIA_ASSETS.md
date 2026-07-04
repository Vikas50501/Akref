# MEDIA_ASSETS.md — AKINNA media manifest & upload guide

> Companion to [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md). Lists every place the theme
> expects merchant media and where the source files live, so the store can be populated
> to match akinna.com.
>
> **Last updated:** 2026-07-04 · **Covers phase 9 (Assets & metafields).**

---

## 1. Bundling policy (why large media isn't in `assets/`)

**Bundled in the theme (`assets/`) — already done:** fonts (`*.woff2`), brand/press
logos and product-feature icons (`brand_*.png|webp`). These are small, shared, and
version with the theme.

**Uploaded by the merchant (NOT bundled) — this document:** hero banners,
founder/lifestyle photography, product galleries, and all videos. Reasons:

- Shopify's per-asset limit and theme-package size make bundling large media a bad
  practice; videos in particular must live in **Shopify Files / native video**, not the
  theme package.
- Product/collection imagery belongs to the product & collection records (so it powers
  search, cards, and the PDP gallery), not the theme.
- Merchant-uploaded media stays editable in the Theme Editor without a theme redeploy.

The theme therefore exposes `image_picker` / `video` / `video_url` settings for all of
these, with graceful `placeholder_svg_tag` fallbacks until media is added.

---

## 2. Where the source files are

| Source | Path / pattern |
|---|---|
| HTTrack capture (images, ~3.8 MB) | `..\_httrack_extract\Akina final\www.akinna.com\cdn\shop\files\` |
| HTTrack capture (videos, ~75 MB, HD-1080p mp4) | `..\_httrack_extract\Akina final\www.akinna.com\cdn\shop\videos\c\vp\<id>\<id>*.mp4` |
| Live CDN (full-resolution originals) | `https://www.akinna.com/cdn/shop/files/<name>` and `/cdn/shop/videos/c/vp/<id>/...` |

> ⚠️ The HTTrack images are mostly **small cropped derivatives** (filenames contain
> `..._20x24_crop_center...`). For production, pull the **full-resolution originals** from
> the live CDN (drop the `_<WxH>_crop_center<hash>` suffix) or re-export from the brand's
> asset library. Use the captured files only as a placement reference.

---

## 3. Upload targets by section

Add these in **Online Store → Themes → Customize**, in each section's settings.
"Video" fields accept a Shopify-hosted video (upload to **Content → Files** first) or a
`video_url` (YouTube/Vimeo/MP4 link).

| Section (file) | Media setting(s) | What to upload |
|---|---|---|
| Header (`header.liquid`) | logo, mobile logo, transparent-mode logo, favicon, promo image | Logos are already bundled in `assets/` — set in **Theme settings → Branding**, or upload here. Mega-menu promo image optional. |
| Hero slideshow (`hero-slideshow.liquid`) | per-slide desktop + mobile image | Homepage hero banner(s), desktop **and** mobile crops. |
| Image with text (`image-text.liquid`) | image (×3 across blocks) | Founder portrait + material/craft lifestyle shots. |
| Background video (`background-video.liquid`) | video, `video_url`, poster image | Atelier / craft ambient video + poster still. |
| Collection showcase (`collection-showcase.liquid`) | image | Featured-collection editorial image (or leave — uses collection image). |
| Brand feature (`brand-feature.liquid`) | image ×2 | "AKINNA Green" feature imagery. |
| Testimonials media (`testimonials.liquid`) | up to 6 (images/video per block) | Press/testimonial visuals. |
| Club banner (`club-banner.liquid`) | image | Membership/club CTA background. |
| Logo marquee (`logo-marquee.liquid`) | logo (per block) | Press logos — several already bundled as `brand_*`. |
| Instagram (`instagram.liquid`) | image (per block) | Feed thumbnails (manual grid). See metaobject option in METAFIELDS.md §6.1. |
| Media carousel (`media-carousel.liquid`) | image/video (per block) | "Elements" + "Feature" carousels on PDP. |
| Video banner (`video-banner.liquid`) | video, `video_url`, poster | PDP full-width video + poster. |
| What fits inside (`what-fits-inside.liquid`) | up to 6 (images per block) | Product "what fits inside" illustration set. |
| Icon grid (`icon-grid.liquid`) | icon (per block) | Symbol/feature icons — several bundled as `brand_*`. |
| Product information (`main-product.liquid`) | trust-badge icons ×3 | Small badge icons (or reuse bundled `brand_*`). |
| Product carousel (`product-carousel.liquid`) | fallback image | Optional. |
| Page header (`page-header.liquid`) | image | Per-page hero. |
| Store locator (`store-locator.liquid`) | image (per store) | Store photos. |
| Events (`events.liquid`) | image (per event) ×4 | Event photos. |
| Footer (`footer.liquid`) | image | Optional footer brand image. |
| Password (`main-password.liquid`) | image | Coming-soon background. |

**Product & collection imagery** is uploaded on the **product/collection records**
themselves (not sections): each product's media populates the PDP gallery
(`product-media-gallery`) and the hover-swap product cards; each collection's image
feeds cards and the collection banner fallback.

---

## 4. Videos captured (for reference)

Seven HD-1080p mp4s were captured under `...\cdn\shop\videos\c\vp\`. To reuse:
1. Upload the desired `.mp4` to **Content → Files** (or add as native product/section
   video).
2. Select it in the relevant section's **Video** field (Background video, Video banner,
   Testimonials, Media carousel).
3. Always also set a **poster image** so there's no blank frame before playback.

> The `.m3u8` streaming manifests in the capture are Shopify's adaptive-stream artifacts
> — ignore them; upload the `.mp4` originals.

---

## 5. Quick population checklist

- [ ] Upload logos/favicon in **Theme settings → Branding** (bundled files available).
- [ ] Homepage: hero slide(s) desktop+mobile, founder + material images, atelier video + poster.
- [ ] Products: full media per product (drives gallery + cards + recommendations).
- [ ] Collections: banner/thumbnail image per collection.
- [ ] PDP extras: video banner + poster, what-fits-inside set, media carousels.
- [ ] Press logos + Instagram grid (bundled `brand_*` cover several).
- [ ] Store locator / events photos as applicable.

See [METAFIELDS.md](METAFIELDS.md) for the custom-data definitions.
