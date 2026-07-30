# GUI entities

All **`GUI_*`** types use **`gui?: IAnimation<IEntityGUI>`**. The animated value is
**`IEntityGUI`** — access via **`gui.currentValue`**.

---

## `IEntityGUI`

Three breakpoints; each holds stateful style blocks.

| Key | Notes |
|-----|-------|
| `desktop` | Default/base breakpoint. |
| `tablet` | Tablet override breakpoint. |
| `mobile` | Mobile override breakpoint. |

Omitted breakpoint → runtime cascade (desktop-first).

---

## `IGUIStates`

Per breakpoint: up to four states; each is **`IGUIProperties`**.

| State | When |
|-------|------|
| `default` | Base look (required). |
| `hover` | Pointer over. |
| `active` | Pressed / toggled on. |
| `focus` | Keyboard / focus ring. |

---

## `IGUIProperties`

UIKit + Cyango field union.

Quick reference (most-used fields per category):

| Category | Key fields |
|----------|------------|
| Layout | `flexDirection`, `justifyContent`, `alignItems`, `gap`, `overflow`, `positionType` |
| Sizing | `width`, `height`, `minWidth`/`maxWidth`, `aspectRatio` |
| Spacing | `padding`, `margin` (+ per-side variants) |
| Typography | `text` (Cyango `LocalizationObject`), `textColor`, `fontSize`, `fontWeight`, `lineHeight`, `textAlign` |
| Box | `backgroundColor`, `backgroundOpacity`, `borderRadius`, `borderColor`, `opacity` |
| Image | `src`, `objectFit`, `keepAspectRatio` |
| Video | `src`, `volume`, `loop`, `muted`, `autoplay` |
| SVG | `src`, `content` |
| Input | `value`, `placeholder`, `type`, `disabled` |
| Checkbox/Switch | `checked`, `defaultChecked`, `disabled` |

> **`text` key pitfall**: runtime key is `"en-US"` (hyphen). Using `"en_US"` (underscore) silently creates a dead key.

---

## MCP paths

- Create: `gui` in `add_entities` `overrides` (deep-merge vs type defaults).
- Update: `gui.currentValue.<breakpoint>.<state>.<prop>` e.g. `gui.currentValue.desktop.default.width`, `gui.currentValue.desktop.hover.backgroundColor`.

---

## UIKit / HTML role analogy

Each `GUI_*` entity maps to a **@react-three/uikit** component: a **Yoga-driven flex layout** in the **Three.js scene graph**, not browser DOM nodes. The **HTML analogue** column below is a **role shorthand** for choosing primitives (e.g. container vs text vs image), not a claim that layout, events, or styling match the browser.

| Entity | UIKit element | HTML analogue |
|--------|---------------|---------------|
| `GUI_SCREEN` | `Fullscreen` | `<body>` |
| `GUI_CONTAINER` | `Container` | `<div>` |
| `GUI_TEXT` | `Text` | `<p>` |
| `GUI_IMAGE` | `Image` | `<img>` |
| `GUI_VIDEO` | `Video` | `<video>` |
| `GUI_VECTOR` | `Svg` | `<svg>` |
| `GUI_ICON` | `Image` (icon sizing) | `<img>` (icon) |
| `GUI_INPUT` | `Input` | `<input>` |
| `GUI_CHECKBOX` | `Checkbox` (default kit) | `<input type="checkbox">` |
| `GUI_SWITCH` | `Switch` (default kit) | `<input type="checkbox">` (toggle) |
| `GUI_SLIDER` | `Slider` (default kit) | `<input type="range">` |
| `LOTTIE` | `Image` (rasterised Lottie) | `<img>` (animated) |

> `LOTTIE` has no `GUI_` prefix but renders through the same uikit stack, so it takes layout, sizing, spacing, background and position from `gui.currentValue` exactly like `GUI_IMAGE`. Playback lives in `animations` — see [animated-common.md](../animated/animated-common.md).

---

## Per-type notes

| Type | Role | Key details |
|------|------|-------------|
| `GUI_SCREEN` | Screen entity in every scene (`<body>` analogue) | Added automatically on scene creation — do not add manually. Non-removable. |
| `GUI_CONTAINER` | Flex layout box (`<div>` analogue) | The main wrapper: `flexDirection`, `gap`, `padding`, `backgroundColor`, `borderRadius`. Use `hover`/`active` states for interactive cards and buttons. |
| `GUI_TEXT` | Typography block (`<p>` analogue) | `text` (localized), `textColor`, `fontSize`, `fontWeight`, `textAlign`. Give explicit `width` (e.g. `"100%"`) inside flex parents for `textAlign` to work. |
| `GUI_IMAGE` | Raster image (`<img>` analogue) | Image `src` / URL, sizing, `objectFit`-style behavior, opacity, border. |
| `GUI_VIDEO` | Video in UI (`<video>` analogue) | Video source props, `videoControls`, sizing. |
| `GUI_VECTOR` | SVG content | SVG path/fill/stroke props. |
| `GUI_ICON` | Icon from the bundled **Lucide** set | `iconSrc` is the icon name (`"X"`, `"ChevronLeft"`, `"Play"`) — no asset or SVG needed; unknown names fall back to `ArrowRight`. `iconSize` sizes it (`width`/`height` do not). Accepts click actions. Use it for every icon — never a glyph character in `GUI_TEXT`. |
| `GUI_INPUT` | Text field | `value`, `placeholder`, `type`. Use `focus` state for focus ring. |
| `GUI_CHECKBOX` | Checkbox | Checked state, label alignment. `hover`/`active` for affordance. |
| `GUI_SWITCH` | Toggle switch | On/off value, track/knob styling. |
| `GUI_SLIDER` | Range input | Min/max/step/value. Use for volume, progress, bounded floats. |
