---
name: ogdynamic-canvas
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

### Fill

A background fill — plain color, gradient, or raw CSS background-image. The canvas root carries one, and every node can carry its own (`background`). It must be an **object, never a list**, with **exactly four keys** — unknown keys anywhere (fill, gradient, stop, image) are rejected. `kind` selects which branch renders; keep **all three branches populated** even when inactive (the editor's fill-switcher depends on it); only the branch matching `kind` is strictly required, and it must be well formed.

```jsonc
{
    "kind": "solid",            // "solid" | "gradient" | "image" — required
    "color": "#0f172a",         // solid branch — any CSS color string, ≤128 chars
    "gradient": {               // gradient branch — exactly 3 keys
        "type": "linear",       // "linear" | "radial"
        "angle": 135,           // number, degrees (used by linear; radial ignores it)
        "stops": [              // list of stops (required when kind is gradient)
            { "color": "#4f46e5", "position": 0 },    // color: CSS string ≤128 chars
            { "color": "#0f172a", "position": 100 },  // position: number 0–100, rendered in order
        ],
    },
    "image": { "source": null }, // image branch — raw CSS background-image, ≤4096 chars
}
```

- **`"kind": "solid"`** — plain color. `color` is required; any CSS color works (hex, `rgb()`, `hsl()`, named).

```jsonc
{ "kind": "solid", "color": "#0f172a",
  "gradient": { "type": "linear", "angle": 135, "stops": [] },
  "image": { "source": null } }
```

- **`"kind": "gradient"`** — linear or radial. `gradient` is required with `type`, `angle`, and `stops`.

```jsonc
{ "kind": "gradient", "color": "#0f172a",
  "gradient": { "type": "radial", "angle": 0, "stops": [
      { "color": "#fb7185", "position": 0 }, { "color": "#f43f5e", "position": 100 }] },
  "image": { "source": null } }
```

- **`"kind": "image"`** — raw CSS `background-image` in `source` (≤4096 chars): everything the other two can't express — remote photos via `url()`, layered gradients, repeating patterns. Pair with node style `backgroundSize` / `backgroundPosition` / `backgroundRepeat` to control fitting.

```jsonc
// A photo
{ "kind": "image", "color": "#0f172a",
  "gradient": { "type": "linear", "angle": 135, "stops": [] },
  "image": { "source": "url('https://assets.ogdynamic.com/template-assets/photo.webp')" } }

// A photo with a darkening overlay (layers, first on top)
{ "kind": "image", "color": "#0f172a",
  "gradient": { "type": "linear", "angle": 135, "stops": [] },
  "image": { "source": "linear-gradient(rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.6)), url('https://assets.ogdynamic.com/template-assets/photo.webp')" } }

// A grid pattern via repeating gradients
{ "kind": "image", "color": "#0f172a",
  "gradient": { "type": "linear", "angle": 135, "stops": [] },
  "image": { "source": "repeating-linear-gradient(0deg, transparent 0 31px, rgba(148, 163, 184, 0.2) 31px 32px), repeating-linear-gradient(90deg, transparent 0 31px, rgba(148, 163, 184, 0.2) 31px 32px)" } }
```

**Gotcha:** an `image` fill ignores `color` — the base color is **not** composited under the image layers. When layering `url()` photos or patterns, append an opaque base as the **last** layer (layers render top→bottom): `"..., linear-gradient(#f8fafc, #f8fafc)"`.

### Node

Strict 12-key allow-list; unknown keys anywhere are rejected:

```jsonc
{
    "id": "tpl-title",   // required, non-empty, ≤100 chars, unique in the document
    "type": "text",      // "text" | "image" | "group"
    "name": "Title",     // label (layers panel), ≤100 chars
    "width": 940,        // px number or CSS length string ≤64 chars ("100%")
    "height": 240,       // image nodes REQUIRE width + height; text/group may omit
                         //   (auto-size: text → content, group → in-flow children)
    "style": {},         // camelCase CSS — position lives here, never x/y
    "text": "Hello",     // text nodes only, ≤10,000 chars
    "src": "https://…",  // image nodes only, remote http(s) URL, ≤2048 chars
    "children": [],      // group nodes only
    "dynamic": true,     // content swappable at render time
    "fieldId": "title",  // override key, `[a-zA-Z0-9][a-zA-Z0-9_]{0,63}`, no leading `_`
    "background": {},    // per-node Fill, same contract as the root
}
```

**Text gotchas:** a text node with `text: ""` renders as **nothing**, and whitespace-only text (`" "`) normalizes to `null` on save — which then fails validation on the next write. For invisible solid-color boxes and dashed/gradient decorations, use a **group** node with a `background` Fill instead (a Fill renders at the group's `width`×`height`; a text node with only a background collapses).

### Positioning

There is no `x`/`y` on a node — **`style.left` is the x coordinate and `style.top` is the y coordinate**. To move an element, position it `"absolute"` and change `style.left`/`style.top` (px numbers; absolute layers anchor to the canvas). `"position": "static"` joins the flex flow with zero offsets — those layers are moved by flex layout (order, margins), not coordinates. Full-bleed bands are `"width": "100%"` inside a flex-column group.

### Layout architecture — flex-first, absolute-last

Default to a single flex tree; absolute positioning is only for decorative fixed-size motifs whose position is independent of content length.

```
Body (group, "100%" × "100%", flex column, padding "88px 80px 40px 80px")
├── Main (flex row, alignItems "stretch", flexGrow 1)
│   ├── Left column (flex column, gap 24, alignItems "flex-start")
│   │   ├── badge pill (text node: background, radius 999, padding, uppercase)
│   │   ├── title (dynamic, maxLines 3, textOverflow "ellipsis")
│   │   └── description (dynamic, maxLines 4, textOverflow "ellipsis")
│   └── Right column (fixed width, flex column, justifyContent "center", alignItems "center")
│       └── decorative motif (group)
└── Footer (flex row, justifyContent "space-between", alignItems "center", width "100%")
```

- **Content drives position.** Stack copy with `gap` — never hardcode `top` for text; a 2-line vs 3-line title must reflow automatically.
- **Pin footers by flow**, not coordinates: the footer is a sibling after a `flexGrow: 1` main row, or uses `marginTop: "auto"` inside a full-height column.
- **`alignItems: "flex-start"` on column containers** so pill/text children shrink-wrap instead of stretching full width; override per child with `alignSelf`.
- **Guard overflow:** every dynamic text gets `maxLines` + `textOverflow: "ellipsis"` sized for the worst case.
- Edge padding for 1200×630: 80px sides, ≥40px bottom, 64–96px top depending on header weight.

### Style properties

CamelCase CSS passed verbatim to the Takumi engine. Values are scalar (string, number, boolean); a **bare number means `px`**; strings allow `%`, `rem`, `em`, `calc()`. Colors are any CSS color (hex, `rgb()`, `hsl()`, named). These lists are exhaustive — never invent a property or value.

#### Layout

| Property                            | Values                                                                |
| ----------------------------------- | --------------------------------------------------------------------- |
| `position`                          | `static` \| `relative` \| `absolute` \| `fixed`                        |
| `top` / `right` / `bottom` / `left` | Length                                                                |
| `display`                           | `none` \| `flex` \| `inline-flex` \| `block` \| `inline` \| `inline-block` \| `grid` |
| `boxSizing`                         | `content-box` \| `border-box`                                         |
| `zIndex`                            | number \| `auto`                                                      |

#### Sizing

`width`, `height`, `minWidth`, `minHeight`, `maxWidth` (| `none`), `maxHeight` (| `none`), `aspectRatio` — all Length.

#### Spacing

`margin`, `marginTop`, `marginRight`, `marginBottom`, `marginLeft`, `padding`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft` — all Length (shorthand strings like `"8px 16px"` allowed).

#### Flexbox

| Property                          | Values                                                                                                                                    |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `flexDirection`                   | `row` \| `row-reverse` \| `column` \| `column-reverse`                                                                                     |
| `flexWrap`                        | `nowrap` \| `wrap` \| `wrap-reverse`                                                                                                       |
| `flexGrow` / `flexShrink`         | number                                                                                                                                    |
| `flexBasis`                       | Length \| `content`                                                                                                                        |
| `justifyContent` / `alignContent` | `normal` \| `start` \| `end` \| `flex-start` \| `flex-end` \| `center` \| `stretch` \| `space-between` \| `space-around` \| `space-evenly` |
| `alignItems` / `alignSelf`        | `normal` \| `start` \| `end` \| `flex-start` \| `flex-end` \| `center` \| `baseline` \| `stretch`                                          |
| `gap` / `rowGap` / `columnGap`    | Length                                                                                                                                    |
| `order`                           | number                                                                                                                                    |

#### Grid

`gridTemplateColumns`: string.

#### Border / outline / radius

| Property                                                                                                          | Values                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `borderWidth`, `borderTopWidth`, `borderRightWidth`, `borderBottomWidth`, `borderLeftWidth`                        | Length                                                                                                          |
| `borderStyle`, `outlineStyle`                                                                                     | `none` \| `hidden` \| `dotted` \| `dashed` \| `solid` \| `double` \| `groove` \| `ridge` \| `inset` \| `outset` |
| `borderColor`, `outlineColor`                                                                                     | Color                                                                                                           |
| `borderRadius` — **use this for all corner rounding**                                                              | Length, 1–4 values (`tl tr br bl`), or elliptical `widths / heights` for blob/organic shapes: `"62% 55% 45% 58% / 38% 45% 55% 42%"` |
| `borderTopLeftRadius`, `borderTopRightRadius`, `borderBottomRightRadius`, `borderBottomLeftRadius`                 | Length or `"h v"` pair — only when a single corner must differ; otherwise prefer the `borderRadius` shorthand    |
| `outlineWidth`                                                                                                    | Length                                                                                                          |

#### Background

| Property             | Values                                   |
| -------------------- | ---------------------------------------- |
| `backgroundColor`    | Color                                    |
| `backgroundImage`    | string (CSS `background-image` value)    |
| `backgroundSize`     | `auto` \| `cover` \| `contain` \| Length |
| `backgroundPosition` | string                                   |
| `backgroundRepeat`   | string                                   |

#### Effects

| Property                                                                                    | Values              |
| ------------------------------------------------------------------------------------------- | ------------------- |
| `opacity`                                                                                   | Length (0–1)        |
| `overflow`, `overflowX`, `overflowY`                                                        | `visible` \| `hidden` \| `clip` |
| `boxShadow`, `filter`, `backdropFilter`, `mixBlendMode`, `transform`, `rotate`, `clipPath`  | string (CSS value)  |
| `transformOrigin`                                                                           | Length              |

#### Typography

| Property                                                       | Values                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------ |
| `color`                                                        | Color                                                        |
| `fontFamily`                                                   | Registered family (table below)                              |
| `fontSize`, `lineHeight`, `letterSpacing`, `wordSpacing`        | Length                                                       |
| `fontWeight`                                                   | number from the family's row \| `normal` \| `bold` \| `bolder` \| `lighter` |
| `fontStyle`                                                    | `normal` \| `italic` \| `oblique`                            |
| `textAlign`                                                    | `left` \| `right` \| `center` \| `justify` \| `start` \| `end` |
| `textTransform`                                                | `none` \| `uppercase` \| `lowercase` \| `capitalize`         |
| `textDecorationLine`                                           | `none` \| `underline` \| `overline` \| `line-through`        |
| `textDecorationColor`                                          | Color                                                        |
| `textDecorationThickness`                                      | `auto` \| `from-font` \| Length                              |
| `textDecorationSkipInk`                                        | `auto` \| `none` (the engine parses only these two)          |
| `textShadow`, `textOverflow` (`clip` \| `ellipsis` \| string)  | string                                                       |
| `whiteSpace`                                                   | `normal` \| `pre` \| `nowrap` \| `pre-wrap` \| `pre-line` \| `break-spaces` |
| `textWrap`                                                     | `wrap` \| `nowrap` \| `balance` \| `pretty`                  |
| `wordBreak`                                                    | `normal` \| `break-all` \| `keep-all` \| `break-word`        |
| `overflowWrap`                                                 | `normal` \| `anywhere` \| `break-word`                       |
| `maxLines`, `lineClamp` (lines before clamping)                | number                                                       |

#### Image

| Property         | Values                                                   |
| ---------------- | -------------------------------------------------------- |
| `objectFit`      | `fill` \| `contain` \| `cover` \| `scale-down` \| `none` |
| `objectPosition` | Length                                                   |
| `imageRendering` | `auto` \| `smooth` \| `pixelated`                        |

### Fonts

`fontFamily` must be an exact registered family — capitalized Google Fonts name (e.g. `"Inter"`, `"Space Grotesk"` — never slugs like `inter` or unregistered families like `Roboto`). Weight ranges are every 100-step value in the range (e.g. `100–900` = 100, 200, … 900).

| Family              | Weights                 | Family            | Weights       |
| ------------------- | ----------------------- | ----------------- | ------------- |
| Alfa Slab One       | 400                     | Montserrat        | 100–900       |
| Anton               | 400                     | Newsreader        | 200–800       |
| Architects Daughter | 400                     | Noto Sans         | 100–900       |
| Archivo Black       | 400                     | Nunito            | 200–1000      |
| Arvo                | 400, 700                | Nunito Sans       | 200–1000      |
| Bebas Neue          | 400                     | Old Standard TT   | 400, 700      |
| Bitter              | 100–900                 | Open Sans         | 300–800       |
| Bricolage Grotesque | 200–800                 | Oswald            | 200–700       |
| Caveat              | 400–700                 | Outfit            | 100–900       |
| Cormorant Garamond  | 300–700                 | Pacifico          | 400           |
| Crimson Text        | 400, 600, 700           | Permanent Marker  | 400           |
| Dancing Script      | 400–700                 | Playfair Display  | 400–900       |
| DM Sans             | 100–1000                | Plus Jakarta Sans | 200–800       |
| DM Mono             | 300, 400, 500           | Poppins           | 100–900       |
| DM Serif Display    | 400                     | Proza Libre       | 400–800       |
| EB Garamond         | 400–800                 | PT Serif          | 400, 700      |
| Epilogue            | 100–900                 | Public Sans       | 100–900       |
| Fira Code           | 300–700                 | Raleway           | 100–900       |
| Fira Sans           | 100–900                 | Roboto Flex       | 100–1000      |
| Fraunces            | 100–900                 | Roboto Mono       | 100–700       |
| Geist               | 100–900                 | Roboto Slab       | 100–900       |
| Great Vibes         | 400                     | Rosarivo          | 400           |
| IBM Plex Mono       | 100–700                 | Sacramento        | 400           |
| IBM Plex Sans       | 100–700                 | Satisfy           | 400           |
| Indie Flower        | 400                     | Source Code Pro   | 200–900       |
| Inter               | 100–900                 | Source Sans 3     | 200–900       |
| JetBrains Mono      | 100–800                 | Space Grotesk     | 300–700       |
| Josefin Slab        | 100–700                 | Space Mono        | 400, 700      |
| Karla               | 200–800                 | Work Sans         | 100–900       |
| Lato                | 100, 300, 400, 700, 900 | Zilla Slab        | 300–700       |
| Libre Baskerville   | 400–700                 |                   |               |
| Libre Franklin      | 100–900                 |                   |               |
| Lobster             | 400                     |                   |               |
| Lora                | 400–700                 |                   |               |
| Manrope             | 200–800                 |                   |               |
| Merriweather        | 300–900                 |                   |               |

`fontWeight` also accepts the keywords `normal` (= 400) and `bold` (= 700). An unsupported weight silently falls back to the family's first available weight — if a headline renders thinner than requested, the weight wasn't in the row.

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
- **Defaults must be publishable**: fill dynamic layers with realistic final-quality copy (fetch the target page's `og:title`/`og:description` when personalizing) — the default render should be usable as-is, never lorem ipsum or placeholder text.
- **One template per site section, not per page** (home, blog post, product…): sibling pages vary only via query params — a new page must never require a new design.

## Conventions

- Every node gets `id`, `type`, `name`, `children: []`; every `background` is a complete Fill (all three branches).
- Wrap the layout in one root Body group (`"100%"` × `"100%"`, flex column) and build it flex-first (see Layout architecture).
- Pills/buttons: style the **text node itself** (backgroundColor + borderRadius + vertical-centering padding) — never a wrapper group around lone text.
- Round corners with a single `borderRadius` — it takes 1–4 values and the elliptical `widths / heights` syntax (e.g. `"borderRadius": "62% 55% 45% 58% / 38% 45% 55% 42%"` for a blob), which replaces four `"h v"` per-corner keys. Use the per-corner keys only when one corner must differ.
- Pick a **three-role font set** per design, all from the registered table: a display family for headings, a body family for descriptions, a mono family for kickers/tags/footers.
- Mark main copy `dynamic: true` with readable `fieldId`s (`title`, `author`, `cta`); use readable unique ids (`tpl-title`).
- Never: `x`/`y`, kebab-case styles, CSS shorthands (`border:` → `borderWidth` + `borderStyle` + `borderColor`), nested style values, invented keys, `_`-prefixed fieldIds, hardcoded image-service URLs (use returned `image_url`s).

## Pre-flight QA

- Every Fill is a complete object (all three branches, `stops` included); no shorthand/kebab-case keys; nothing outside the 12-key node list.
- No `text: ""` or `text: null` anywhere; invisible boxes are group nodes, not empty text.
- Dynamic copy has `maxLines` + ellipsis; the footer is pinned by flow (`flexGrow`/`marginTop: "auto"`), not a hardcoded `top`.
- The render was downloaded and visually checked with ≥2 content variants (short + long), plus `config[intent]=twitter` when that target matters.
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
