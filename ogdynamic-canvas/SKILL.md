---
name: ogdynamic-canvas
description: Design ogdynamic canvases (OG/social images) through the ogdynamic MCP tools — create from templates, edit the document JSON, override dynamic layers, publish renders. Use when creating, editing, or rendering ogdynamic canvases or OG images. Read before authoring a canvas items tree.
---

# ogdynamic canvas skill

A canvas is a background `Fill` plus a tree of nodes (`items`), rendered to webp/png/jpeg. Edit it via the ogdynamic MCP tools; the same JSON hydrates losslessly in the web editor.

Full documentation: [ogdynamic.com/docs](https://ogdynamic.com/docs) — browse it when you need more detail: [#canvases](https://ogdynamic.com/docs#canvases) (tool workflow), [#document-format](https://ogdynamic.com/docs#document-format), [#image-urls](https://ogdynamic.com/docs#image-urls) (URL params & overrides), [#renders](https://ogdynamic.com/docs#renders).

## Workflow

1. **Create** — `list_templates`, then `create_canvas` with `template: {ident_name}` (preferred; blank needs `width`+`height`).
2. **Read first** — `get_canvas` returns the document plus `override_fields`. Always fetch before writing.
3. **Edit** — `update_canvas` (also `name`, `width`, `height`, `status`: 1 = public, 2 = private). `items` **replaces the whole tree** — send it complete, never a patch.
4. **Serve** — every canvas has a permanent `image_url`: `{OGDYNAMIC_URL}/c/{id}`. Public canvases render directly: `?{fieldId}=value&format=webp|png|jpeg&config[intent]=og|twitter` (URL-encode values). **Never `create_render` for a public canvas.**
5. **Publish private canvases** — a private URL 403s; one `create_render` publishes it with overrides baked in. Renders are idempotent (SHA-256 of canvas + overrides) and **track the live canvas** — create a new one only for a *different* override set; check `list_renders` first.

## Document format

Top level: `width`, `height` (px, 1–2048), `background` (Fill), `items` (nodes).

### Fill

Plain color, gradient, or layered CSS gradients. The canvas root carries one; every node can carry its own (`background`). Always an **object, never a list**, with **exactly four keys** — `kind` picks the branch that renders; unknown keys anywhere (fill, gradient, stop, image) are rejected. Keep all three branches populated even when inactive (the editor's fill-switcher depends on it).

```jsonc
{ "kind": "solid",               // "solid" | "gradient" | "image" — required
  "color": "#0f172a",            // solid branch: any CSS color, ≤128 chars
  "gradient": { "type": "linear", "angle": 135,   // "linear" | "radial"; angle in degrees, linear only
      "stops": [ { "color": "#4f46e5", "position": 0 },   // rendered in order, position 0–100
                 { "color": "#0f172a", "position": 100 } ] },
  "image": { "source": null } }  // image branch: raw CSS background-image, ≤4096 chars
```

- `solid`: renders `color`.
- `gradient`: renders `gradient` — `type`, `angle`, ordered `stops`.
- `image`: renders `source` — layered/repeating CSS gradients the other branches can't express, e.g. a grid: `"repeating-linear-gradient(0deg, transparent 0 31px, rgba(148,163,184,.2) 31px 32px), repeating-linear-gradient(90deg, …)"`. Pair with `backgroundSize` / `backgroundPosition` / `backgroundRepeat`.

**Gotchas:** an `image` fill ignores `color` — it is **not** composited under the layers; end layered strings with an opaque base (`…, linear-gradient(#f8fafc, #f8fafc)`). **Remote photos are not supported in fills — `url()` does not render. Photos go in image nodes (`src`).**

### Node

Strict 12-key allow-list; unknown keys anywhere are rejected:

```jsonc
{
    "id": "tpl-title",   // required, non-empty, ≤100 chars, unique in the document
    "type": "text",      // "text" | "image" | "group"
    "name": "Title",     // label (layers panel), ≤100 chars
    "width": 940,        // px number or CSS length string ≤64 chars ("100%") —
                         //   node-level ONLY, never style.width/height: both render,
                         //   but the web editor's overlay/inspector read only the
                         //   node property, so style-form sizes drift its hit-boxes
    "height": 240,       // image nodes REQUIRE width + height; text/group may omit
                         //   (auto-size: text → content, group → in-flow children)
    "style": {},         // camelCase CSS — position lives here, never x/y
    "text": "Hello",     // text nodes only, ≤10,000 chars
    "src": "https://…",  // image nodes only, remote http(s) URL, ≤2048 chars — the only way to render a photo
    "children": [],      // group nodes only
    "dynamic": true,     // content swappable at render time
    "fieldId": "title",  // override key, `[a-zA-Z0-9][a-zA-Z0-9_]{0,63}`, no leading `_`
    "background": {},    // per-node Fill, same contract as the root
}
```

**Text gotchas:** `text: ""` renders as **nothing**, and whitespace-only text (`" "`) normalizes to `null` on save — which fails validation on the next write. For invisible solid-color boxes and dashed/gradient decorations, use a **group** node with a `background` Fill instead (a Fill renders at the group's `width`×`height`; a text node with only a background collapses).

### Layout — flex-first, absolute-last

There is no `x`/`y` on a node: **`style.left` is the x coordinate and `style.top` is the y coordinate**, and only `position: "absolute"` nodes use them — they anchor to the canvas. Everything else is flow-positioned and moved by flex layout (order, margins, gap), never coordinates. Default to a single flex tree; absolute is only for decorative fixed-size motifs whose position is independent of content length.

The canonical document shape — one root Body group, a flexGrow main row, a flow-pinned footer:

```jsonc
"items": [{
    "id": "body", "type": "group", "width": "100%", "height": "100%",
    "style": { "display": "flex", "flexDirection": "column", "padding": "88px 80px 40px" },
    "children": [
        // Main row — flexGrow 1 pushes the footer to the bottom edge
        { "id": "main", "type": "group",
            "style": { "display": "flex", "flexGrow": 1 },
            "children": [
                // Copy column — stacks by gap, shrink-wraps via alignItems flex-start
                { "id": "col", "type": "group",
                    "style": { "display": "flex", "flexDirection": "column", "gap": 24, "alignItems": "flex-start" },
                    "children": [
                        // badge pill: the TEXT node styled directly — backgroundColor,
                        // borderRadius 999, padding "6px 14px", textTransform uppercase
                        // title: dynamic, width ~660, maxLines 3, textOverflow "ellipsis"
                        // description: dynamic, maxLines 4, ellipsis
                    ] },
                // Fixed-width panel (node-level width) — logo, photo, or motif
                { "id": "panel", "type": "group", "width": 360,
                    "style": { "display": "flex", "alignItems": "center", "justifyContent": "center" } }
            ] },
        // Footer — pinned by flow as the sibling after the flexGrow row
        { "id": "footer", "type": "group", "width": "100%",
            "style": { "display": "flex", "justifyContent": "space-between", "alignItems": "center" } }
    ] }]
```

- **Content drives position** — stack copy with `gap`, never a hardcoded `top`; a 2-line vs 3-line title must reflow automatically.
- Pin footers by flow: sibling after a `flexGrow: 1` main row, or `marginTop: "auto"` inside a full-height column.
- `alignItems: "flex-start"` on columns so pill/text children shrink-wrap (stretch is the default); override per child with `alignSelf`.
- Guard overflow: every dynamic text gets `maxLines` + `textOverflow: "ellipsis"` sized for the worst case.
- Edge padding for 1200×630: 80px sides, ≥40px bottom, 64–96px top.
- Photos are image nodes (`src` + `width`/`height` + `objectFit: "cover"`); for a darkening overlay, lay a group with a semi-transparent gradient `background` above the photo, not a fill `url()`.

### Style properties

CamelCase CSS passed verbatim to the rendering engine. Values are scalar (string, number, boolean); a **bare number means `px`**; strings allow `%`, `rem`, `em`, `calc()`. Colors are any CSS color (hex, `rgb()`, `hsl()`, named).

The complete machine-readable inventory — every property, enum, and cap — is **`schema.json`**, the JSON Schema (draft-07) file next to this skill. It mirrors the app's `resources/canvas-templates/schema.json` (update both in lockstep) and rejects unknown keys and values, so **validate the document against it before sending**. The rules the schema cannot teach:

- `position`: omit it for normal flow — flex/grid children are placed by the flow and never need `left`/`top`. `absolute` + `left`/`top` escapes the flow (decorations); `relative` anchors them. Never write `static` (it is the default), never `fixed`, and never `bottom`/`right`/`inset` — `left`/`top` are the only anchors.
- `width`/`height` are node-level only (see Node) — style-form sizes render but desync the web editor overlay.
- `padding`/`margin` accept 1–4 value shorthand strings; every other property is a longhand (no `border:` — use `borderWidth` + `borderStyle` + `borderColor`).
- `borderRadius` takes 1–4 values and the elliptical `widths / heights` blob syntax (`"62% 55% 45% 58% / 38% 45% 55% 42%"`); per-corner keys only when a single corner must differ.
- `backgroundImage` is layered/repeating CSS gradients only — `url()` does not render (see Fill).
- Dynamic text pairs `maxLines` (or `lineClamp`) with `textOverflow: "ellipsis"` so overrides truncate instead of overflowing.

### Fonts

`fontFamily` must be an exact registered family — capitalized Google Fonts name (e.g. `"Inter"`, `"Space Grotesk"` — never slugs like `inter` or unregistered families like `Helvetica`). `fontWeight`: keywords `normal` (=400) / `bold` (=700) or any 100-step number in the family's range; unsupported weights silently fall back to the family's first available one.

| Family | Weights | Family | Weights |
| --- | --- | --- | --- |
| Alegreya | 400–900 | Libre Franklin | 100–900 |
| Alfa Slab One | 400 | Literata | 200–900 |
| Anton | 400 | Lobster | 400 |
| Architects Daughter | 400 | Lora | 400–700 |
| Archivo | 100–900 | Manrope | 200–800 |
| Archivo Black | 400 | Merriweather | 300–900 |
| Arimo | 400–700 | Montserrat | 100–900 |
| Arvo | 400, 700 | Mulish | 200–1000 |
| Assistant | 200–800 | Newsreader | 200–800 |
| Baloo 2 | 400–800 | Noto Sans | 100–900 |
| Bebas Neue | 400 | Noto Serif | 100–900 |
| Bitter | 100–900 | Nunito | 200–1000 |
| Bodoni Moda | 400–900 | Nunito Sans | 200–1000 |
| Bricolage Grotesque | 200–800 | Old Standard TT | 400, 700 |
| Cairo | 200–1000 | Open Sans | 300–800 |
| Caveat | 400–700 | Oswald | 200–700 |
| Cinzel | 400–900 | Outfit | 100–900 |
| Comfortaa | 300–700 | Overpass | 100–900 |
| Cormorant Garamond | 300–700 | Pacifico | 400 |
| Crimson Text | 400, 600, 700 | Permanent Marker | 400 |
| Dancing Script | 400–700 | Playfair Display | 400–900 |
| DM Mono | 300–500 | Plus Jakarta Sans | 200–800 |
| DM Sans | 100–1000 | Poppins | 100–900 |
| DM Serif Display | 400 | Proza Libre | 400–800 |
| EB Garamond | 400–800 | PT Serif | 400, 700 |
| Epilogue | 100–900 | Public Sans | 100–900 |
| Exo 2 | 100–900 | Quicksand | 300–700 |
| Figtree | 300–900 | Raleway | 100–900 |
| Fira Code | 300–700 | Red Hat Display | 300–900 |
| Fira Sans | 100–900 | Red Hat Text | 300–700 |
| Fraunces | 100–900 | Roboto | 100–900 |
| Fredoka | 300–700 | Roboto Condensed | 100–900 |
| Geist | 100–900 | Roboto Flex | 100–1000 |
| Geist Mono | 100–900 | Roboto Mono | 100–700 |
| Great Vibes | 400 | Roboto Serif | 100–900 |
| Hanken Grotesk | 100–900 | Roboto Slab | 100–900 |
| Heebo | 100–900 | Rosarivo | 400 |
| IBM Plex Mono | 100–700 | Rubik | 300–900 |
| IBM Plex Sans | 100–700 | Sacramento | 400 |
| Inconsolata | 200–900 | Satisfy | 400 |
| Indie Flower | 400 | Sora | 100–800 |
| Instrument Sans | 400–700 | Source Code Pro | 200–900 |
| Inter | 100–900 | Source Sans 3 | 200–900 |
| Inter Tight | 100–900 | Source Serif 4 | 200–900 |
| JetBrains Mono | 100–800 | Space Grotesk | 300–700 |
| Josefin Sans | 100–700 | Space Mono | 400, 700 |
| Josefin Slab | 100–700 | Syne | 400–800 |
| Jost | 100–900 | Unbounded | 200–900 |
| Karla | 200–800 | Urbanist | 100–900 |
| Lato | 100, 300, 400, 700, 900 | Work Sans | 100–900 |
| Lexend | 100–900 | Zilla Slab | 300–700 |
| Libre Baskerville | 400–700 | |  |  |


## Limits

Validation is strict — a passing document always renders, so fix errors instead of retrying blind. Enforced on every write (editor save and `update_canvas` share the rules).

| Constraint                     | Limit                             |
| ------------------------------ | --------------------------------- |
| Canvas sides                   | 1–2048 px                         |
| Nodes per doc                  | 500                               |
| Nesting depth                  | 32                                |
| `text`                         | 10,000 chars                      |
| `src`                          | 2,048 chars                       |
| `fieldId`                      | `[a-zA-Z0-9][a-zA-Z0-9_]{0,63}`   |
| Style values                   | scalar, ≤2000 chars each          |
| Fill `color` / stop `color`    | ≤128 chars                        |
| Fill `source`                  | ≤4096 chars                       |
| `id` / `name`                  | ≤100 chars                        |
| Node size strings              | ≤64 chars                         |

## Dynamic overrides

- **URL** (public canvases): `?{fieldId}=value` replaces the node's `text` (or `src` for an image node). Unknown keys are ignored.
- **Renders** (`create_render` `override`): `{fieldId: {…}}` — text layers take `content`/`color`/`backgroundColor`, image layers `src`/`backgroundColor`, groups `backgroundColor`. Unknown fields or wrong props are **rejected** with the list of what the canvas actually has. Colors are hex (`#rgb`…`#rrggbbaa`; `transparent` for backgrounds); `content` ≤2000 chars.
- **Defaults must be publishable**: fill dynamic layers with realistic final-quality copy (fetch the target page's `og:title`/`og:description` when personalizing) — never lorem ipsum or placeholders.
- **One template per site section, not per page** (home, blog post, product…): sibling pages vary only via query params; a new page must never require a new design.

## Conventions

- Every node gets `id`, `type`, `name`, `children: []`; every `background` is a complete Fill (all three branches).
- Build the flex-first skeleton from Layout; style pills directly on the text node — never a wrapper group around lone text.
- Prefer one `borderRadius` (1–4 values, elliptical `w / h` for blobs) over per-corner keys; per-corner only when one corner differs.
- Pick a **three-role font set** from the registered table: display family for headings, body for descriptions, mono for kickers/tags/footers.
- Mark main copy `dynamic: true` with readable `fieldId`s (`title`, `author`, `cta`); use readable unique ids (`tpl-title`).
- Never: `x`/`y`, `style.width`/`style.height` (node-level only), kebab-case styles, CSS shorthands (`border:` → `borderWidth` + `borderStyle` + `borderColor`), nested style values, invented keys, `_`-prefixed fieldIds, `url()` in any background (photos are image-node `src`), hardcoded image-service URLs (use returned `image_url`s).

## Pre-flight QA

- Fill objects complete (all three branches, `stops`); no shorthand/kebab keys; nothing outside the 12-key node list; sizes on the node, never in `style`.
- No `text: ""`/`null`; dynamic copy has `maxLines` + ellipsis; footer pinned by flow, not `top`.
- Render downloaded and visually checked with ≥2 variants (short + long), plus `config[intent]=twitter` when that target matters.
- Exports roundtrip: strip server fields (`id`, `image_url`, `override_fields`, timestamps); no `null` values anywhere.

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

1200×630, flex skeleton, badge + overridable headline:

```jsonc
{
    "width": 1200, "height": 630,
    "background": { "kind": "gradient", "color": "#0f172a",
        "gradient": { "type": "linear", "angle": 135, "stops": [
            { "color": "#4f46e5", "position": 0 }, { "color": "#0f172a", "position": 100 }] },
        "image": { "source": null } },
    "items": [{
        "id": "body", "type": "group", "name": "Body", "width": "100%", "height": "100%",
        "style": { "display": "flex", "flexDirection": "column", "justifyContent": "center",
                   "padding": "80px" },
        "children": [
            { "id": "badge", "type": "text", "name": "Badge", "children": [],
              "style": { "backgroundColor": "#14b8a6", "color": "#042f2e", "fontFamily": "Inter",
                         "fontSize": 20, "fontWeight": "600", "padding": "8px 16px",
                         "borderRadius": 9999, "textTransform": "uppercase" },
              "text": "v2.0 is live" },
            { "id": "headline", "type": "text", "name": "Headline", "width": 900, "children": [],
              "dynamic": true, "fieldId": "title",
              "style": { "color": "#f8fafc", "fontFamily": "Space Grotesk", "fontSize": 72,
                         "fontWeight": "700", "lineHeight": 1.1, "marginTop": 24,
                         "maxLines": 3, "textOverflow": "ellipsis" },
              "text": "Ship OG images like a pro" }
        ] }]
}
```
