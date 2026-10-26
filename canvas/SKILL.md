---
name: canvas
description: Design, create, edit, and render ogdynamic canvas OG images — layered documents (a background fill plus a tree of text/image/group nodes) rendered to webp/png/jpeg by the ogdynamic image service. Use when working with ogdynamic canvases through the ogdynamic MCP tools (list_templates, get_canvas, create_canvas, update_canvas, create_render, …), authoring canvas document JSON or canvas template definitions, building dynamic OG/social-preview images with override fields, or whenever the user mentions canvases, OG images, or ogdynamic image rendering. Read before building or editing a canvas items tree.
---

# Canvas design skill (ogdynamic)

A canvas is a layered document — a background `Fill` plus a tree of nodes (`items`) — rendered to an image (webp/png/jpeg) by the ogdynamic image service. The same document shape is used by the web editor, the canvas templates, and the render service, so anything you author through `update_canvas` hydrates losslessly in the editor.

## Workflow

1. **Start from a template** — `list_templates`, then `create_canvas` with `template: {ident_name}`. Prefer this over a blank canvas; templates carry proven layer structure, sizing, and dynamic fields. Blank creation needs explicit `width`/`height` and yields a white solid fill with no layers.
2. **Inspect before editing** — `get_canvas` returns the full document _and_ its `override_fields` (each dynamic layer's `field`, `name`, `type`, `default`). Always read before you write.
3. **Edit** — `update_canvas` with `background` and/or `items`. `items` **replaces the whole tree** (no merge): send the complete document back, not a patch.
4. **Serve the image** — every canvas already has the permanent URL `{OGDYNAMIC_URL}/c/{id}` (returned as `image_url`). A **public** canvas renders straight from that URL — append `?{fieldId}=value` for dynamic overrides, `format`, and `config[intent]`. **Do not call `create_render` for a public canvas.**
5. **Private canvases only** — a private canvas's URL alone returns 403; `create_render` once publishes it: the returned `image_url` carries your fixed overrides baked in and serves publicly. Create another render only for a _different_ override set — **never** after merely editing the canvas.

## Document format

Top level (the canvas row): `width` and `height` in px (1–2048 each), `background` (a `Fill`), `items` (`CanvasNode[]`).

### Fill

`kind` selects which branch renders, but **keep all three branches populated at all times** — the editor's fill-switcher and Vue reactivity depend on it:

```jsonc
{
    "kind": "solid", // "solid" | "gradient" | "image"
    "color": "#0f172a", // solid branch — any CSS color string (≤128 chars)
    "gradient": {
        // gradient branch
        "type": "linear", // "linear" | "radial"
        "angle": 135, // degrees (linear)
        "stops": [
            { "color": "#fb7185", "position": 0 },
            { "color": "#f43f5e", "position": 100 }, // position: 0–100
        ],
    },
    "image": { "source": null }, // image branch — raw CSS background-image
} // (layered gradients, url(), patterns; ≤4096 chars)
```

Only `kind` is required; the branch matching `kind` must be present and well formed. No other keys.

### CanvasNode

```jsonc
{
    "id": "tpl-title", // required, non-empty, ≤100 chars, stable and never
    //   reused within one document
    "type": "text", // required: "text" | "image" | "group"
    "name": "Title", // human label (Layers panel), ≤100 chars
    "width": 940, // number (px) or CSS length string like "100%" (≤64 chars);
    "height": 240, //   optional for text/group (auto-size), REQUIRED for image
    "style": {/* NodeStyle */}, // see below — position lives here, not on the node
    "text": "Hello", // text nodes only, ≤10000 chars
    "src": "https://…", // image nodes only — remote URL, ≤2048 chars
    "children": [], // groups only — a real tree, any depth (within caps)
    "dynamic": true, // marks content overridable at render time
    "fieldId": "title", // override key for dynamic layers
    "background": {/* Fill */}, // per-node Fill, same contract as the root
}
```

These twelve keys are the complete allow-list — unknown keys anywhere are rejected.

### Positioning

- There is **no `x`/`y`**. Position is `style.left` / `style.top` (px numbers). Never emit `x`/`y`.
- Give absolutely positioned layers `"position": "absolute"`; the render engine makes the root container `position: relative`, so they anchor to the canvas viewport.
- `"position": "static"` layers participate in flow (flex layouts); offsets reset to 0.
- Full-bleed bands use `"width": "100%"` inside a flex-column body group.

### The style model

`style` is an object of **camelCase CSS properties passed verbatim to the [Takumi](https://takumi.kane.tw) CSS layout engine**. Every value must be a **scalar** (string, number, boolean) — nested objects/arrays are rejected. Bare numbers mean `px`. Supported groups:

- **Layout**: `position`, `top`/`right`/`bottom`/`left`, `display`, `zIndex`, `boxSizing`
- **Sizing**: `width`/`height` (+ `min*`/`max*`), `aspectRatio`
- **Spacing**: `margin*`, `padding*` (shorthand + longhands)
- **Flexbox**: `flexDirection`, `flexWrap`, `flexGrow`/`flexShrink`/`flexBasis`, `justifyContent`, `alignItems`/`alignContent`/`alignSelf`, `gap`, `order`
- **Border / radius**: `border{Side}Width`, `borderStyle`, `borderColor`, `borderRadius` (+ per-corner)
- **Background**: `backgroundColor`, `backgroundImage`, `backgroundSize`/`Position`/`Repeat`
- **Effects**: `opacity`, `overflow`, `boxShadow`, `filter`, `backdropFilter`, `transform`, `rotate`, `clipPath`, `mixBlendMode`
- **Typography**: `color`, `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`, `textAlign`, `textTransform`, `textDecorationLine`, `textShadow`, `whiteSpace`, `wordBreak`, `maxLines`, `lineClamp`, …
- **Image**: `objectFit`, `objectPosition`, `imageRendering`

Style values are capped at 2000 characters each.

### Fonts

`fontFamily` is the **exact Google Fonts family name** — capitalized display name, not a slug: `"Inter"`, `"Space Grotesk"`, `"Alfa Slab One"`. It must be one of the 66 families the render service registers (same set the editor offers):

| `fontFamily`          | Available `fontWeight` values |
| --------------------- | ----------------------------- |
| `Alfa Slab One`       | 400                           |
| `Anton`               | 400                           |
| `Architects Daughter` | 400                           |
| `Archivo Black`       | 400                           |
| `Arvo`                | 400, 700                      |
| `Bebas Neue`          | 400                           |
| `Bitter`              | 100–900 (variable)            |
| `Bricolage Grotesque` | 200–800 (variable)            |
| `Caveat`              | 400, 500, 600, 700            |
| `Cormorant Garamond`  | 300, 400, 500, 600, 700       |
| `Crimson Text`        | 400, 600, 700                 |
| `Dancing Script`      | 400, 500, 600, 700            |
| `DM Sans`             | 100–1000 (variable)           |
| `DM Mono`             | 300, 400, 500                 |
| `DM Serif Display`    | 400                           |
| `EB Garamond`         | 400, 500, 600, 700, 800       |
| `Epilogue`            | 100–900 (variable)            |
| `Fira Code`           | 300, 400, 500, 600, 700       |
| `Fira Sans`           | 100–900 (variable)            |
| `Fraunces`            | 100–900 (variable)            |
| `Geist`               | 100–900 (variable)            |
| `Great Vibes`         | 400                           |
| `IBM Plex Mono`       | 100–700                       |
| `IBM Plex Sans`       | 100–700                       |
| `Indie Flower`        | 400                           |
| `Inter`               | 100–900 (variable)            |
| `JetBrains Mono`      | 100–800                       |
| `Josefin Slab`        | 100–700                       |
| `Karla`               | 200–800                       |
| `Lato`                | 100, 300, 400, 700, 900       |
| `Libre Baskerville`   | 400, 500, 600, 700            |
| `Libre Franklin`      | 100–900 (variable)            |
| `Lobster`             | 400                           |
| `Lora`                | 400, 500, 600, 700            |
| `Manrope`             | 200–800                       |
| `Merriweather`        | 300–900                       |
| `Montserrat`          | 100–900 (variable)            |
| `Newsreader`          | 200–800                       |
| `Noto Sans`           | 100–900 (variable)            |
| `Nunito`              | 200–1000 (variable)           |
| `Nunito Sans`         | 200–1000 (variable)           |
| `Old Standard TT`     | 400, 700                      |
| `Open Sans`           | 300–800                       |
| `Oswald`              | 200–700                       |
| `Outfit`              | 100–900 (variable)            |
| `Pacifico`            | 400                           |
| `Permanent Marker`    | 400                           |
| `Playfair Display`    | 400–900                       |
| `Plus Jakarta Sans`   | 200–800                       |
| `Poppins`             | 100–900                       |
| `Proza Libre`         | 400–800                       |
| `PT Serif`            | 400, 700                      |
| `Public Sans`         | 100–900 (variable)            |
| `Raleway`             | 100–900 (variable)            |
| `Roboto Flex`         | 100–1000 (variable)           |
| `Roboto Mono`         | 100–700                       |
| `Roboto Slab`         | 100–900 (variable)            |
| `Rosarivo`            | 400                           |
| `Sacramento`          | 400                           |
| `Satisfy`             | 400                           |
| `Source Code Pro`     | 200–900                       |
| `Source Sans 3`       | 200–900                       |
| `Space Grotesk`       | 300–700                       |
| `Space Mono`          | 400, 700                      |
| `Work Sans`           | 100–900 (variable)            |
| `Zilla Slab`          | 300–700                       |

`fontWeight` takes a number from the family's row above (or the keywords `normal` = 400, `bold` = 700). An unsupported weight falls back to the family's first available weight — if a headline looks thinner than requested, the weight isn't in the row. Variable families accept every 100-step weight in their range.

## Validation contract

`App\Rules\CanvasItems` / `CanvasFill` enforce everything above on every write (editor saves and MCP updates share the rules); violations return tool validation errors. Hard limits:

| Constraint               | Limit                                                                  |
| ------------------------ | ---------------------------------------------------------------------- |
| Canvas dimensions        | 1–2048 px per side                                                     |
| Total nodes per document | 500                                                                    |
| Nesting depth            | 32 levels                                                              |
| `text`                   | ≤ 10,000 chars                                                         |
| `src`                    | ≤ 2,048 chars                                                          |
| `fieldId`                | `[a-zA-Z0-9][a-zA-Z0-9_]{0,63}` (≤64 chars, **no leading underscore**) |
| Style values             | scalar, ≤ 2,000 chars                                                  |

A document that passes validation always renders — fix validation errors, don't retry blind.

## Dynamic layers and overrides

Any text or image node can be marked `dynamic: true` with a `fieldId`; its content is then swappable at render time:

- **URL overrides** (public canvas URL `GET /c/{id}`): `?{fieldId}=value` replaces the node's `text` (or `src` for images). Matching is exact; non-dynamic layers and unknown keys are ignored.
- **Render overrides** (`create_render`): a `{fieldId: {…props}}` object. Properties allowed per layer type — text: `content`, `color`, `backgroundColor`; image: `src`, `backgroundColor`; group: `backgroundColor`. Unknown field ids and foreign properties are **rejected** (not ignored) with a message listing what the canvas actually has. `color`/`backgroundColor` must be hex (`#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`; `backgroundColor` also `transparent`), `content` ≤ 2000 chars, `src` a valid http(s) URL.
- Params starting with `_` are reserved for the app (e.g. `_updatedAt`, `_key`) — never a `fieldId`.

## Renders

A render exists for exactly two reasons: **publishing a private canvas** (its URL alone 403s) and **pinning one fixed override set** as a distinct composition.

- Its id is the SHA-256 of `canvas + canonical override` — **idempotent**: the same request always returns the same render and URL.
- Its image URL (`{OGDYNAMIC_URL}/c/{canvasId}?_key={hash}`) serves publicly regardless of the canvas's own privacy status — creating the render is the owner's consent to publish that composition.
- What is baked in is the **override set only**: the URL accepts no `?{fieldId}` overrides (the served document has no dynamic markers left). `format` and `config[intent]` still work.
- **Render URLs track the live canvas**: editing the canvas with `update_canvas` updates every existing render's output automatically (within the image service's 10 s document cache). You never re-render after an edit.
- Create a new render only when you want a **different override set**. Listing: `list_renders` shows what already exists — check there before creating.

## Canvas status and image URLs

- `status: 1` = public, `2` = private (on `update_canvas`; `list_canvases` filters accept `"public"`/`"private"`). Private canvases can't be rendered by URL alone — publish via renders.
- Every canvas has the permanent URL `{OGDYNAMIC_URL}/c/{id}`, taking `format=webp|png|jpeg` (default webp), `config[intent]=og` (1200×630) or `twitter` (1200×600), and `?{fieldId}=…` overrides.
- Renders are deterministic: identical document + params → byte-identical output.

## Example

A minimal 1200×630 canvas with an overridable headline and a badge:

```jsonc
{
    "name": "Launch banner",
    "width": 1200,
    "height": 630,
    "background": {
        "kind": "gradient",
        "color": "#0f172a",
        "gradient": {
            "type": "linear",
            "angle": 135,
            "stops": [
                { "color": "#4f46e5", "position": 0 },
                { "color": "#0f172a", "position": 100 },
            ],
        },
        "image": { "source": null },
    },
    "items": [
        {
            "id": "badge",
            "type": "text",
            "name": "Badge",
            "style": {
                "position": "absolute",
                "left": 80,
                "top": 64,
                "backgroundColor": "#14b8a6",
                "color": "#042f2e",
                "fontFamily": "Inter",
                "fontSize": 20,
                "fontWeight": "600",
                "padding": "8px 16px",
                "borderRadius": 9999,
            },
            "text": "v2.0 is live",
            "children": [],
        },
        {
            "id": "headline",
            "type": "text",
            "name": "Headline",
            "width": 1040,
            "style": {
                "position": "absolute",
                "left": 80,
                "top": 200,
                "color": "#f8fafc",
                "fontFamily": "Space Grotesk",
                "fontSize": 72,
                "fontWeight": "700",
                "lineHeight": 1.1,
            },
            "text": "Ship OG images like a pro",
            "dynamic": true,
            "fieldId": "title",
            "children": [],
        },
    ],
}
```

## Authoring conventions

Conventions that keep documents editor-safe (applies to `update_canvas` payloads and to template JSON definitions alike):

1. Every node gets `id`, `type`, `name`, and `children: []`; every `background` is a **complete** Fill (all three branches).
2. Readable ids (`tpl-title`, `tpl-author`), never reused within a document.
3. Main copy layers get `dynamic: true` + a sanitized `fieldId` (lowercase `[a-z0-9_]`, no leading underscore).
4. Style pills/buttons **on the text node itself** (background + `borderRadius` + centering `padding` like `"17px 0px"`) rather than wrapping groups; shape cards/bands as groups with solid fills + `borderRadius`. The only sanctioned single-text-child groups are full-bleed layout sections and flex-centering parents.
5. Keep 64–80px safe padding from canvas edges and give copy generous fixed heights.
6. One root `Body` group (`width`/`height` `"100%"`, flex column) wrapping the layout keeps percentage bands working.
7. Images use `https://placehold.co/…` or `https://assets.ogdynamic.com/template-assets/…` URLs; demo personas only (Sarah Chen, Jane Cooper, David Park…), never real people.

## Do

- Start from a template when one fits; blank only for custom layouts.
- Call `get_canvas` before editing and after — it shows the live document and the real `override_fields`.
- Send the **complete** `items` tree on every `update_canvas` (it replaces, not merges).
- Use camelCase CSS properties, scalar values, bare numbers for px.
- Size image nodes explicitly (`width` + `height`); remote `src` URLs only.
- Check `fontFamily` against the font table above (exact capitalized Google Fonts name) and `fontWeight` against that family's available weights.
- Use `create_render` only for private canvases or genuinely new override sets — never per edit; rely on its idempotency.
- URL-encode override values appended to image URLs.

## Don't

- Don't invent node, Fill, or gradient keys — the allow-lists above are exhaustive; unknown keys fail validation.
- Don't position with `x`/`y`, kebab-case properties, or nested style values.
- Don't prefix a `fieldId` with `_` (reserved: `_updatedAt`, `_key`).
- Don't exceed the caps (2048px sides, 500 nodes, 32 depth, 10k text).
- Don't call `create_render` for a **public** canvas — its `image_url` already serves with query overrides; a render adds nothing.
- Don't re-render after editing a canvas — existing render URLs reflect the edit automatically; make a new render only for a different override set.
- Don't submit override props a layer type doesn't accept (e.g. `src` on a text layer) — it's an error, not a no-op.
- Don't hardcode image-service URLs — use the `image_url` values the tools return.

## Tool reference

| Tool               | Purpose                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------ |
| `list_templates`   | Template starting points (`ident_name`, category, dimensions), optional `category` filter  |
| `list_canvases`    | Your canvases, newest first; `status` (`public`/`private`), exact `width`/`height` filters |
| `get_canvas`       | Full document + `override_fields` + `image_url`                                            |
| `create_canvas`    | From `template` (ident_name) or blank (`width` + `height`); optional `name`                |
| `duplicate_canvas` | Copy one of your canvases by `id`                                                          |
| `update_canvas`    | Partial update by `id`: `name`, `width`, `height`, `status` (1/2), `background`, `items`   |
| `delete_canvas`    | Delete by `id`                                                                             |
| `create_render`    | Publish a private canvas or pin a new override set: `canvasId` + `override`                |
| `list_renders`     | Your renders, newest first; optional `canvasId` filter                                     |
| `delete_render`    | Delete by `id` (the SHA-256 hash)                                                          |

All tools operate only on the authenticated user's own canvases.

Without the MCP connection, the same operations exist as OAuth2 REST endpoints (`GET /canvases`, `POST /renders`, scopes `canvases:read` / `canvases:render`) — see `docs/api/v1.md` in the ogdynamic app repo.

## Working in the ogdynamic codebase

When changing the canvas feature itself (ogdynamic Laravel app / ogdynamic-rs), the canonical references live in the app repo:

- `docs/canvas/` — README (architecture), `document-format.md`, `editor.md`, `templates.md`, `rendering.md`, `http-api.md`
- `resources/canvas-templates/*.json` + `schema.json` — template definitions (Draft-07 schema for editor IntelliSense); seeded by `php artisan db:seed --class=CanvasTemplateSeeder --no-interaction`, which prunes rows whose files are gone
- `php artisan canvas-templates:previews --only={ident_name} --no-interaction` — regenerate gallery thumbnails after editing a definition (requires the render service running)
- `app/Rules/CanvasFill.php` / `app/Rules/CanvasItems.php` — the validation contract every write path shares
- `tests/Feature/CanvasTemplateSeederTest.php` — enforces the authoring invariants above (root body group, no text-wrapper pills, registered fonts, well-formed dynamic fields)
- This skill is also served to MCP clients at `skill://canvas/SKILL.md` from `resources/skills/canvas/SKILL.md` in the app repo — keep the two copies in sync when the contract changes.
