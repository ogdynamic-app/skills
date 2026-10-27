# Canvas reference

Detailed data for the canvas skill — consult when you need exact font weights, the full style-property list with accepted values, or field-level constraints. The essentials live in `SKILL.md`; this file is the exhaustive source.

## Fonts

`fontFamily` must be an exact registered family below (capitalized Google Fonts name). Weight ranges are every 100-step value in the range (e.g. `100–900` = 100, 200, … 900).

| Family                | Weights             | Family              | Weights       |
| --------------------- | ------------------- | ------------------- | ------------- |
| Alfa Slab One         | 400                 | Montserrat          | 100–900       |
| Anton                 | 400                 | Newsreader          | 200–800       |
| Architects Daughter   | 400                 | Noto Sans           | 100–900       |
| Archivo Black         | 400                 | Nunito              | 200–1000      |
| Arvo                  | 400, 700            | Nunito Sans         | 200–1000      |
| Bebas Neue            | 400                 | Old Standard TT     | 400, 700      |
| Bitter                | 100–900             | Open Sans           | 300–800       |
| Bricolage Grotesque   | 200–800             | Oswald              | 200–700       |
| Caveat                | 400–700             | Outfit              | 100–900       |
| Cormorant Garamond    | 300–700             | Pacifico            | 400           |
| Crimson Text          | 400, 600, 700       | Permanent Marker    | 400           |
| Dancing Script        | 400–700             | Playfair Display    | 400–900       |
| DM Sans               | 100–1000            | Plus Jakarta Sans   | 200–800       |
| DM Mono               | 300, 400, 500       | Poppins             | 100–900       |
| DM Serif Display      | 400                 | Proza Libre         | 400–800       |
| EB Garamond           | 400–800             | PT Serif            | 400, 700      |
| Epilogue              | 100–900             | Public Sans         | 100–900       |
| Fira Code             | 300–700             | Raleway             | 100–900       |
| Fira Sans             | 100–900             | Roboto Flex         | 100–1000      |
| Fraunces              | 100–900             | Roboto Mono         | 100–700       |
| Geist                 | 100–900             | Roboto Slab         | 100–900       |
| Great Vibes           | 400                 | Rosarivo            | 400           |
| IBM Plex Mono         | 100–700             | Sacramento          | 400           |
| IBM Plex Sans         | 100–700             | Satisfy             | 400           |
| Indie Flower          | 400                 | Source Code Pro     | 200–900       |
| Inter                 | 100–900             | Source Sans 3       | 200–900       |
| JetBrains Mono        | 100–800             | Space Grotesk       | 300–700       |
| Josefin Slab          | 100–700             | Space Mono          | 400, 700      |
| Karla                 | 200–800             | Work Sans           | 100–900       |
| Lato                  | 100, 300, 400, 700, 900 | Zilla Slab      | 300–700       |
| Libre Baskerville     | 400–700             |                     |               |
| Libre Franklin        | 100–900             |                     |               |
| Lobster               | 400                 |                     |               |
| Lora                  | 400–700             |                     |               |
| Manrope               | 200–800             |                     |               |
| Merriweather          | 300–900             |                     |               |

`fontWeight` also accepts the keywords `normal` (= 400) and `bold` (= 700). An unsupported weight silently falls back to the family's first available weight — if a headline renders thinner than requested, the weight wasn't in the row.

## Node fields

The 12-key allow-list. Unknown keys anywhere are rejected.

| Field        | Applies to     | Constraint                                                                                             |
| ------------ | -------------- | ------------------------------------------------------------------------------------------------------ |
| `id`         | all            | Required, non-empty, ≤100 chars, unique within the document                                             |
| `type`       | all            | `"text"` \| `"image"` \| `"group"`                                                                      |
| `name`       | all            | Human label (Layers panel), ≤100 chars                                                                  |
| `width`      | all            | px number or CSS length string ≤64 chars (`"100%"`, `"50%"`). Image nodes: **required**                  |
| `height`     | all            | Same as `width`. Image nodes: **required**. Text/group may omit → auto-size (text → content, group → in-flow children) |
| `style`      | all            | `NodeStyle` object — camelCase CSS, scalar values, each ≤2000 chars                                     |
| `text`       | text           | ≤10,000 chars                                                                                           |
| `src`        | image          | Remote http(s) URL, ≤2048 chars                                                                         |
| `children`   | group          | Node tree; ≤32 nesting levels, ≤500 nodes per document                                                  |
| `dynamic`    | text, image    | Marks content overridable at render time                                                                |
| `fieldId`    | text, image    | `[a-zA-Z0-9][a-zA-Z0-9_]{0,63}` — no leading `_` (`_updatedAt`, `_key` are app-reserved)                 |
| `background` | all            | Complete `Fill` (below), same contract as the canvas root                                               |

## Fill

A background fill — plain color, gradient, or raw CSS background-image. The canvas root carries one, and every node can carry its own (`background`). It must be an **object, never a list**, with **exactly four keys**: `kind`, `color`, `gradient`, `image`. `kind` selects which branch renders; keep **all three branches populated** even when inactive (the editor's fill-switcher depends on it), with the branch matching `kind` present and well formed.

```jsonc
{
    "kind": "solid",            // "solid" | "gradient" | "image" — required
    "color": "#0f172a",         // solid branch — any CSS color string, ≤128 chars
    "gradient": {               // gradient branch — exactly 3 keys
        "type": "linear",       // "linear" | "radial"
        "angle": 135,           // number, degrees (used by linear)
        "stops": [              // list of stops (required when kind is gradient)
            { "color": "#4f46e5", "position": 0 },    // color: CSS string ≤128 chars
            { "color": "#0f172a", "position": 100 },  // position: number 0–100
        ],
    },
    "image": { "source": null }, // image branch — raw CSS background-image, ≤4096 chars
}
```

Unknown keys at any level (fill, gradient, stop, image) are rejected. Only the branch matching `kind` is strictly required; the inactive ones may hold `null`/empty values but should stay present.

### `"kind": "solid"` — plain color

`color` is required. Any CSS color works: hex, `rgb()`, `hsl()`, named colors.

```jsonc
{ "kind": "solid", "color": "#0f172a",
  "gradient": { "type": "linear", "angle": 135, "stops": [] },
  "image": { "source": null } }
```

### `"kind": "gradient"` — linear or radial

`gradient` is required: `type` (`linear` | `radial`), `angle` in degrees (used by `linear`; `radial` ignores it), and `stops` — each `{ color, position }` with position 0–100, rendered in list order.

```jsonc
{ "kind": "gradient", "color": "#0f172a",
  "gradient": { "type": "radial", "angle": 0, "stops": [
      { "color": "#fb7185", "position": 0 }, { "color": "#f43f5e", "position": 100 }] },
  "image": { "source": null } }
```

### `"kind": "image"` — raw CSS background-image

`image.source` is required: a CSS `background-image` value up to 4096 chars. This branch covers everything the other two can't express — remote photos via `url()`, layered gradients, repeating patterns. Combine with node style `backgroundSize` / `backgroundPosition` / `backgroundRepeat` to control fitting.

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

A Fill that passes validation always renders.

## Style properties

CamelCase CSS passed verbatim to the Takumi engine. Values are scalar (string, number, boolean); a **bare number means `px`**; strings allow `%`, `rem`, `em`, `calc()`. Colors are any CSS color (hex, `rgb()`, `hsl()`, named).

### Layout

| Property                   | Values                                                         |
| -------------------------- | -------------------------------------------------------------- |
| `position`                 | `static` \| `relative` \| `absolute` \| `fixed`                 |
| `top` / `right` / `bottom` / `left` | Length                                                |
| `display`                  | `none` \| `flex` \| `inline-flex` \| `block` \| `inline` \| `inline-block` \| `grid` |
| `boxSizing`                | `content-box` \| `border-box`                                  |
| `zIndex`                   | number \| `auto`                                               |

### Sizing

`width`, `height`, `minWidth`, `minHeight`, `maxWidth` (| `none`), `maxHeight` (| `none`), `aspectRatio` — all Length.

### Spacing

`margin`, `marginTop`, `marginRight`, `marginBottom`, `marginLeft`, `padding`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft` — all Length (shorthand strings like `"8px 16px"` allowed).

### Flexbox

| Property                                      | Values                                                                                                            |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `flexDirection`                               | `row` \| `row-reverse` \| `column` \| `column-reverse`                                                             |
| `flexWrap`                                    | `nowrap` \| `wrap` \| `wrap-reverse`                                                                               |
| `flexGrow` / `flexShrink`                     | number                                                                                                            |
| `flexBasis`                                   | Length \| `content`                                                                                                |
| `justifyContent` / `alignContent`             | `normal` \| `start` \| `end` \| `flex-start` \| `flex-end` \| `center` \| `stretch` \| `space-between` \| `space-around` \| `space-evenly` |
| `alignItems` / `alignSelf`                    | `normal` \| `start` \| `end` \| `flex-start` \| `flex-end` \| `center` \| `baseline` \| `stretch`                   |
| `gap` / `rowGap` / `columnGap`                | Length                                                                                                            |
| `order`                                       | number                                                                                                            |

### Grid

`gridTemplateColumns`: string.

### Border / outline / radius

| Property                                                                 | Values                                                                          |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `borderWidth`, `borderTopWidth`, `borderRightWidth`, `borderBottomWidth`, `borderLeftWidth` | Length                                                       |
| `borderStyle`, `outlineStyle`                                            | `none` \| `hidden` \| `dotted` \| `dashed` \| `solid` \| `double` \| `groove` \| `ridge` \| `inset` \| `outset` |
| `borderColor`, `outlineColor`                                            | Color                                                                           |
| `borderRadius`, `borderTopLeftRadius`, `borderTopRightRadius`, `borderBottomRightRadius`, `borderBottomLeftRadius` | Length                                 |
| `outlineWidth`                                                           | Length                                                                          |

### Background

| Property             | Values                                   |
| -------------------- | ---------------------------------------- |
| `backgroundColor`    | Color                                    |
| `backgroundImage`    | string (CSS `background-image` value)    |
| `backgroundSize`     | `auto` \| `cover` \| `contain` \| Length |
| `backgroundPosition` | string                                   |
| `backgroundRepeat`   | string                                   |

### Effects

| Property        | Values                                   |
| --------------- | ---------------------------------------- |
| `opacity`       | Length (0–1)                             |
| `overflow`, `overflowX`, `overflowY` | `visible` \| `hidden` \| `clip` |
| `boxShadow`, `filter`, `backdropFilter`, `mixBlendMode`, `transform`, `rotate`, `clipPath` | string (CSS value) |
| `transformOrigin` | Length                                 |

### Typography

| Property                                                                 | Values                                                       |
| ------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `color`                                                                  | Color                                                        |
| `fontFamily`                                                             | Registered family (table above)                              |
| `fontSize`, `lineHeight`, `letterSpacing`, `wordSpacing`                  | Length                                                       |
| `fontWeight`                                                             | number from the family's row \| `normal` \| `bold` \| `bolder` \| `lighter` |
| `fontStyle`                                                              | `normal` \| `italic` \| `oblique`                            |
| `textAlign`                                                              | `left` \| `right` \| `center` \| `justify` \| `start` \| `end` |
| `textTransform`                                                          | `none` \| `uppercase` \| `lowercase` \| `capitalize`         |
| `textDecorationLine`                                                     | `none` \| `underline` \| `overline` \| `line-through`        |
| `textDecorationColor`                                                    | Color                                                        |
| `textDecorationThickness`                                                | `auto` \| `from-font` \| Length                              |
| `textDecorationSkipInk`                                                  | `auto` \| `none` (the engine parses only these two)          |
| `textShadow`, `textOverflow` (`clip` \| `ellipsis` \| string)             | string                                                       |
| `whiteSpace`                                                             | `normal` \| `pre` \| `nowrap` \| `pre-wrap` \| `pre-line` \| `break-spaces` |
| `textWrap`                                                               | `wrap` \| `nowrap` \| `balance` \| `pretty`                  |
| `wordBreak`                                                              | `normal` \| `break-all` \| `keep-all` \| `break-word`        |
| `overflowWrap`                                                           | `normal` \| `anywhere` \| `break-word`                       |
| `maxLines`, `lineClamp` (lines before clamping)                           | number                                                       |

### Image

| Property         | Values                                            |
| ---------------- | ------------------------------------------------- |
| `objectFit`      | `fill` \| `contain` \| `cover` \| `scale-down` \| `none` |
| `objectPosition` | Length                                            |
| `imageRendering` | `auto` \| `smooth` \| `pixelated`                 |

## Validation limits

Enforced on every write (editor save and `update_canvas` share the rules); violations return validation errors. A passing document always renders — fix errors, don't retry blind.

| Constraint        | Limit                                     |
| ----------------- | ----------------------------------------- |
| Canvas sides      | 1–2048 px                                 |
| Nodes per doc     | 500                                       |
| Nesting depth     | 32                                        |
| `text`            | 10,000 chars                              |
| `src`             | 2,048 chars                               |
| `fieldId`         | `[a-zA-Z0-9][a-zA-Z0-9_]{0,63}`           |
| Style values      | scalar, ≤2000 chars each                  |
| Fill `color`      | ≤128 chars                                |
| Fill `source`     | ≤4096 chars                               |
| `id` / `name`     | ≤100 chars                                |
| Node size strings | ≤64 chars                                 |
