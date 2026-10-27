---
name: canvas
description: Design ogdynamic canvases (OG/social images) through the ogdynamic MCP tools — create from templates, edit the document JSON, override dynamic layers, publish renders. Use when creating, editing, or rendering ogdynamic canvases or OG images. Read before authoring a canvas items tree.
---

# ogdynamic canvas skill

A canvas is a background `Fill` plus a tree of nodes (`items`), rendered to webp/png/jpeg. Edit it via the ogdynamic MCP tools; the same JSON hydrates losslessly in the web editor.

## Workflow

1. **Create** — `list_templates`, then `create_canvas` with `template: {ident_name}` (preferred; blank needs `width`+`height` and starts empty).
2. **Read first** — `get_canvas` returns the document plus `override_fields`. Always fetch before writing.
3. **Edit** — `update_canvas` (also takes `name`, `width`, `height`, `status`: 1 = public, 2 = private). `items` **replaces the whole tree** — always send it complete, never a patch.
4. **Serve** — every canvas has a permanent `image_url`: `{OGDYNAMIC_URL}/c/{id}`. Public canvases render directly: `?{fieldId}=value&format=webp|png|jpeg&config[intent]=og|twitter` (URL-encode values). **Never `create_render` for a public canvas.**
5. **Publish private canvases** — a private URL 403s; one `create_render` publishes it with your overrides baked in. Renders are idempotent (SHA-256 of canvas + overrides) and **track the live canvas** — editing updates existing render URLs, so create a new render only for a *different* override set; check `list_renders` first.

## Document format

Top level: `width`, `height` (px, 1–2048), `background` (Fill), `items` (nodes).

**Fill** — keep **all three branches populated**; `kind` picks the renderer:

```jsonc
{
    "kind": "solid", // "solid" | "gradient" | "image"
    "color": "#0f172a",
    "gradient": { "type": "linear", "angle": 135, "stops": [
        { "color": "#fb7185", "position": 0 }, { "color": "#f43f5e", "position": 100 }] },
    "image": { "source": null },
}
```

**Node** — strict 12-key allow-list; unknown keys anywhere are rejected:

```jsonc
{
    "id": "tpl-title",   // required, unique in doc, ≤100 chars
    "type": "text",      // "text" | "image" | "group"
    "name": "Title",     // layers-panel label
    "width": 940,        // px number or "100%"; image nodes REQUIRE width + height
    "height": 240,       // optional for text/group (auto-size)
    "style": {},         // camelCase CSS — position lives here, never x/y
    "text": "Hello",     // text nodes only
    "src": "https://…",  // image nodes only, remote URL
    "children": [],      // group nodes only
    "dynamic": true,     // content swappable at render time
    "fieldId": "title",  // override key
    "background": {},    // per-node Fill, same contract as root
}
```

**Positioning** — no `x`/`y`: use `"position": "absolute"` + `style.left`/`style.top` (px; they anchor to the canvas). `"position": "static"` joins the flex flow with zero offsets. Full-bleed bands are `"width": "100%"` inside a flex-column group.

**Style** — camelCase CSS passed to the Takumi engine; scalar values only (bare numbers = px). Available: layout (`position`, `top/right/bottom/left`, `display`, `zIndex`), sizing (`width`/`height` + `min*`/`max*`, `aspectRatio`), spacing (`margin*`, `padding*`), flexbox (`flexDirection`, `flexWrap`, `flexGrow/Shrink/Basis`, `justifyContent`, `alignItems`/`alignContent`/`alignSelf`, `gap`, `order`), border (`border{Side}Width`, `borderStyle`, `borderColor`, `borderRadius` + per-corner), background (`backgroundColor`, `backgroundImage`, `backgroundSize`/`Position`/`Repeat`), effects (`opacity`, `overflow`, `boxShadow`, `filter`, `backdropFilter`, `transform`, `rotate`, `clipPath`, `mixBlendMode`), typography (`color`, `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`, `textAlign`, `textTransform`, `textDecorationLine`, `textShadow`, `whiteSpace`, `wordBreak`, `maxLines`, `lineClamp`), image (`objectFit`, `objectPosition`, `imageRendering`).

**Fonts** — `fontFamily` must be an exact registered family (capitalized Google Fonts name):

`Alfa Slab One, Anton, Architects Daughter, Archivo Black, Arvo, Bebas Neue, Bitter, Bricolage Grotesque, Caveat, Cormorant Garamond, Crimson Text, Dancing Script, DM Sans, DM Mono, DM Serif Display, EB Garamond, Epilogue, Fira Code, Fira Sans, Fraunces, Geist, Great Vibes, IBM Plex Mono, IBM Plex Sans, Indie Flower, Inter, JetBrains Mono, Josefin Slab, Karla, Lato, Libre Baskerville, Libre Franklin, Lobster, Lora, Manrope, Merriweather, Montserrat, Newsreader, Noto Sans, Nunito, Nunito Sans, Old Standard TT, Open Sans, Oswald, Outfit, Pacifico, Permanent Marker, Playfair Display, Plus Jakarta Sans, Poppins, Proza Libre, PT Serif, Public Sans, Raleway, Roboto Flex, Roboto Mono, Roboto Slab, Rosarivo, Sacramento, Satisfy, Source Code Pro, Source Sans 3, Space Grotesk, Space Mono, Work Sans, Zilla Slab`

Weight 400 exists on every family; 700 on every family except `DM Mono` (300–500). The variable families — Bitter, Bricolage Grotesque, DM Sans, Epilogue, Fira Sans, Fraunces, Geist, Inter, Libre Franklin, Montserrat, Newsreader, Noto Sans, Nunito, Nunito Sans, Outfit, Public Sans, Raleway, Roboto Flex, Work Sans — accept any weight 200–800 (most extend further). Other weights may silently fall back to the family's first available.

## Limits

Validation is strict — a passing document always renders, so fix errors instead of retrying blind: sides 1–2048px · ≤500 nodes · depth ≤32 · `text` ≤10k chars · `src` ≤2048 chars · `fieldId` `[a-zA-Z0-9][a-zA-Z0-9_]{0,63}` (no leading `_` — reserved for the app) · style values scalar, ≤2000 chars.

## Dynamic overrides

- **URL** (public canvases): `?{fieldId}=value` replaces the node's `text` (or `src` for an image node). Unknown keys are ignored.
- **Renders** (`create_render` `override`): `{fieldId: {…}}` — text layers take `content`/`color`/`backgroundColor`, image layers `src`/`backgroundColor`, groups `backgroundColor`. Unknown fields or wrong props are **rejected** with the list of what the canvas actually has. Colors are hex (`#rgb`…`#rrggbbaa`; `transparent` for backgrounds); `content` ≤2000 chars.

## Conventions

- Every node gets `id`, `type`, `name`, `children: []`; every `background` is a complete Fill (all three branches).
- Wrap the layout in one root Body group (`"100%"` × `"100%"`, flex column); keep 64–80px edge padding; give copy generous fixed heights.
- Pills/buttons: style the **text node itself** (backgroundColor + borderRadius + vertical-centering padding) — never a wrapper group around lone text.
- Mark main copy `dynamic: true` with readable `fieldId`s (`title`, `author`, `cta`); use readable unique ids (`tpl-title`).
- Never: `x`/`y`, kebab-case styles, nested style values, invented keys, `_`-prefixed fieldIds, hardcoded image-service URLs (use returned `image_url`s).

## Tools

| Tool               | Purpose                                                          |
| ------------------ | ---------------------------------------------------------------- |
| `list_templates`   | Starting points (`ident_name`, category, size); optional `category` |
| `list_canvases`    | Your canvases; `status` public/private, `width`/`height` filters |
| `get_canvas`       | Full document + `override_fields` + `image_url`                  |
| `create_canvas`    | From `template` ident or blank (`width` + `height`); optional `name` |
| `duplicate_canvas` | Copy by `id`                                                     |
| `update_canvas`    | `name`, `width`, `height`, `status` (1/2), `background`, `items` |
| `delete_canvas`    | Delete by `id`                                                   |
| `create_render`    | Publish a private canvas / pin an override set: `canvasId` + `override` |
| `list_renders`     | Your renders; optional `canvasId` filter                         |
| `delete_render`    | Delete by hash `id`                                              |

All tools operate only on the authenticated user's own canvases.

## Example

1200×630 with a badge and an overridable headline:

```jsonc
{
    "width": 1200, "height": 630,
    "background": { "kind": "gradient", "color": "#0f172a",
        "gradient": { "type": "linear", "angle": 135, "stops": [
            { "color": "#4f46e5", "position": 0 }, { "color": "#0f172a", "position": 100 }] },
        "image": { "source": null } },
    "items": [
        { "id": "badge", "type": "text", "name": "Badge", "children": [],
          "style": { "position": "absolute", "left": 80, "top": 64, "backgroundColor": "#14b8a6",
                     "color": "#042f2e", "fontFamily": "Inter", "fontSize": 20, "fontWeight": "600",
                     "padding": "8px 16px", "borderRadius": 9999 },
          "text": "v2.0 is live" },
        { "id": "headline", "type": "text", "name": "Headline", "width": 1040, "children": [],
          "dynamic": true, "fieldId": "title",
          "style": { "position": "absolute", "left": 80, "top": 200, "color": "#f8fafc",
                     "fontFamily": "Space Grotesk", "fontSize": 72, "fontWeight": "700", "lineHeight": 1.1 },
          "text": "Ship OG images like a pro" },
    ],
}
```
