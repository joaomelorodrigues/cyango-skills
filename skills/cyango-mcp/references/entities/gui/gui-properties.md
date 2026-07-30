# IGUIProperties — full reference

`@react-three/uikit 1.0.64`

Properties live inside `gui.currentValue.<breakpoint>.<state>` (e.g. `desktop.default`). Cyango-only fields marked **(C)**.

> **Value safety:** Use only the types listed in each field's Type column. CSS keywords like `"none"`, `"inherit"`, or `"unset"` are **not supported** unless explicitly listed — they may crash the Yoga/uikit layout engine or spam React errors. Tested failure: `maxHeight: "none"` → `Invalid value none for setMaxHeight`. For "effectively unbounded," use a large numeric value (e.g. `10000`) instead. The string `"auto"` works **only** where the table lists it (e.g. `width`, `height`, `margin`).

---

### Layout (Flex)

| Field | Type | Notes |
|-------|------|-------|
| `flexDirection` | `"row"` · `"column"` · `"row-reverse"` · `"column-reverse"` | |
| `flexWrap` | `"no-wrap"` · `"wrap"` · `"wrap-reverse"` | |
| `justifyContent` | `"flex-start"` · `"center"` · `"flex-end"` · `"space-between"` · `"space-around"` · `"space-evenly"` | |
| `alignItems` | `"flex-start"` · `"center"` · `"flex-end"` · `"stretch"` · `"baseline"` · `"auto"` · `"space-between"` · `"space-around"` · `"space-evenly"` | |
| `alignContent` | same as `alignItems` | |
| `alignSelf` | same as `alignItems` | Per-child override. |
| `flexBasis` | number · `%` | |
| `flexGrow` | number | |
| `flexShrink` | number | |
| `gap` | number | Sets both `gapRow` + `gapColumn` at once. |
| `gapRow` / `gapColumn` | number | |
| `overflow` | `"visible"` · `"hidden"` · `"scroll"` | |
| `positionType` | `"relative"` · `"absolute"` | |
| `inset` | number · `%` | Sets all four position sides at once. |
| `positionTop` / `Right` / `Bottom` / `Left` | number · `%` | |

### Sizing

| Field | Type | Notes |
|-------|------|-------|
| `width` / `height` | number · `%` · `"auto"` | |
| `minWidth` / `minHeight` | number · `%` | |
| `maxWidth` / `maxHeight` | number · `%` | |
| `aspectRatio` | number | Auto-set on `GUI_IMAGE` from `src`. |

### Spacing

| Field | Type | Notes |
|-------|------|-------|
| `padding` | number · `%` | Sets all four sides at once. |
| `paddingX` / `paddingY` | number · `%` | Horizontal / vertical pair. |
| `paddingTop` / `Right` / `Bottom` / `Left` | number · `%` | Individual side. |
| `margin` | number · `%` · `"auto"` | Sets all four sides at once. |
| `marginX` / `marginY` | number · `%` · `"auto"` | Horizontal / vertical pair. |
| `marginTop` / `Right` / `Bottom` / `Left` | number · `%` · `"auto"` | Individual side. |

### Typography

| Field | Type | Notes |
|-------|------|-------|
| `text` | `LocalizationObject` | **(C)** `{ "en-US": "…" }`. Key must be `"en-US"` (hyphen, not `"en_US"`). |
| `textColor` | ColorRepresentation | **(C)** |
| `textOpacity` | number | **(C)** |
| `color` | ColorRepresentation | Inherited text color (UIKit). |
| `fontSize` | number | 1:1 viewport px under `GUI_SCREEN`. |
| `fontWeight` | number · `"bold"` · `"normal"` · `"light"` · `"thin"` · `"medium"` · `"semi-bold"` · `"extra-bold"` · `"black"` · `"extra-light"` · `"extra-black"` | |
| `fontFamily` | string | |
| `lineHeight` | number · "%" · "auto" · string | Matches editor **px** / **%** / **auto**. A **plain number** is a **line-height multiplier** (vs `fontSize`), not raw viewport pixels. For **absolute px**, use a **string with a `px` suffix** (e.g. `"24px"`). Keep effective line height ≥ `fontSize` + a little to avoid clipping (e.g. `fontSize: 20` → `"24px"` or multiplier `1.2`). **Known issue:** `"auto"` can **break the live editor** (disconnect/crash) at time of writing — avoid until fixed; use a multiplier, `"…px"`, or `"%"` instead. |
| `letterSpacing` | number | |
| `textAlign` | `"left"` · `"center"` · `"right"` · `"justify"` | `GUI_TEXT` needs explicit `width` for this to take effect. |
| `verticalAlign` | `"top"` · `"center"` · `"bottom"` | |
| `whiteSpace` | `"normal"` · `"collapse"` · `"pre"` · `"pre-line"` | `"pre"` prevents wrapping. |
| `wordBreak` | `"keep-all"` · `"break-all"` · `"break-word"` | |

### Box / Panel

| Field | Type | Notes |
|-------|------|-------|
| `backgroundColor` | ColorRepresentation | |
| `backgroundOpacity` | number | **(C)** |
| `borderColor` | ColorRepresentation | |
| `borderOpacity` | number | **(C)** |
| `borderWidth` | number | Sets all four sides at once. |
| `borderXWidth` / `borderYWidth` | number | |
| `borderTopWidth` / `RightWidth` / `BottomWidth` / `LeftWidth` | number | |
| `borderRadius` | number | Sets all four corners at once. |
| `borderTopRadius` / `RightRadius` / `BottomRadius` / `LeftRadius` | number | Side shorthand (sets both corners of that side). |
| `borderTopLeftRadius` / `TopRightRadius` / `BottomRightRadius` / `BottomLeftRadius` | number | Individual corner. |
| `borderBend` | number | Panel curvature. |
| `opacity` | number | Overall element opacity. |
| `fill` | ColorRepresentation | SVG fill color (inherited). |

### Transform

| Field | Type | Notes |
|-------|------|-------|
| `transformTranslateX` / `Y` / `Z` | number | |
| `transformScaleX` / `Y` / `Z` | number | |
| `transformRotateX` / `Y` / `Z` | number | Radians. |
| `transformOriginX` | `"left"` · `"center"` · `"right"` | |
| `transformOriginY` | `"top"` · `"center"` · `"bottom"` | |

### Z-order

| Field | Type | Notes |
|-------|------|-------|
| `zIndex` | number | Like CSS `z-index`. |
| `zIndexOffset` | number | Shifts default hierarchy draw order; faster than `zIndex` for reordering siblings of the same type. |

### Scrollbar

| Field | Type | Notes |
|-------|------|-------|
| `scrollbarColor` | ColorRepresentation | |
| `scrollbarOpacity` | number | **(C)** |
| `scrollbarWidth` | number | |
| `scrollbarBorderRadius` | number | Sets all four corners at once. |
| `scrollbarBorder…Radius` | number | Same per-side / per-corner pattern as `borderRadius` (e.g. `scrollbarBorderTopLeftRadius`). |
| `scrollbarBorderColor` | ColorRepresentation | |
| `scrollbarBorderBend` | number | |
| `scrollbarBorderTopWidth` / `RightWidth` / `BottomWidth` / `LeftWidth` / `…` | number | |
| `scrollbarZIndex` | number | |

### Visibility and interaction

| Field | Type | Notes |
|-------|------|-------|
| `visibility` | `"visible"` · `"hidden"` | |
| `pointerEvents` | `"none"` · `"auto"` · `"listener"` | |
| `pointerEventsType` | `"all"` · `{ allow: … }` · `{ deny: … }` | Filter by pointer type. |
| `pointerEventsOrder` | number | |
| `cursor` | string | CSS cursor keyword (e.g. `"pointer"`). |

### Rendering

| Field | Type | Notes |
|-------|------|-------|
| `receiveShadow` / `castShadow` | boolean | |
| `depthTest` / `depthWrite` | boolean | |
| `renderOrder` | number | |
| `anchorX` | `"left"` · `"center"` · `"right"` | |
| `anchorY` | `"top"` · `"center"` · `"bottom"` | |

### Image (`GUI_IMAGE`)

| Field | Type | Notes |
|-------|------|-------|
| `src` | string | Image URL. |
| `objectFit` | `"fill"` · `"cover"` | How image fills when aspect ratio can't be preserved. |
| `keepAspectRatio` | boolean | Default `true`; auto-sets `aspectRatio` from `src`. |

### Video (`GUI_VIDEO`)

| Field | Type | Notes |
|-------|------|-------|
| `src` | string | Video URL or MediaStream. |
| `volume` | number | 0–1. |
| `muted` | boolean | |
| `loop` | boolean | |
| `autoplay` | boolean | |
| `playbackRate` | number | 1 = normal speed. |
| `preservesPitch` | boolean | |
| `playsInline` | boolean | |
| `crossOrigin` | string | |
| `videoControls` | boolean | **(C)** Show native video chrome. |

### SVG (`GUI_VECTOR`)

| Field | Type | Notes |
|-------|------|-------|
| `src` | string | SVG file URL. |
| `content` | string | Inline SVG markup (alternative to `src`). |

### Input (`GUI_INPUT`)

| Field | Type | Notes |
|-------|------|-------|
| `value` | string | Controlled value. |
| `defaultValue` | string | Uncontrolled default. |
| `placeholder` | string | |
| `type` | `"text"` · `"password"` | |
| `disabled` | boolean | |
| `tabIndex` | number | Tab order. |
| `autocomplete` | string | |

### Checkbox / Switch

| Field | Type | Notes |
|-------|------|-------|
| `checked` | boolean | |
| `defaultChecked` | boolean | |
| `disabled` | boolean | |

### Cyango extras

| Field | Type | Notes |
|-------|------|-------|
| `iconSrc` | string | **(C)** Lucide icon name (e.g. `"ArrowRight"`), not a URL. |
| `iconSize` | number | **(C)** |
| `placement` | string | **(C)** |

---

## Type defaults

These defaults describe what the **Cyango Studio editor** actually renders for each `GUI_*` type. They come from hardcoded JSX fallbacks in the editor's `GUI2D_*` components: if a key is **missing** from `gui.currentValue.<breakpoint>.<state>`, the component supplies the value below. Missing keys are **not** written back into story JSON — `get_entity` only shows what you set.

Each `GUI_*` component applies props in this order:

```jsx
<Component
  defaultProp={value}              // A — overridable: entity GUI data wins over these
  {...nearestBreakpointAndState}   // entity's gui.currentValue for current breakpoint/state
  computed={fn(data.specificField)} // B — specific field: UIKit prop name ≠ entity field name
  hardcoded={literal}              // C — immutable: no entity field maps here
/>
```

| Letter | Meaning | Details |
|--------|---------|---------|
| **A** — Overridable | Pre-spread defaults | Set any matching key in `gui.currentValue.desktop.default` (or other breakpoint/state). Same on create (`overrides`) and `update_entities`. Missing keys keep the listed default and are not written to JSON. |
| **B** — Specific field | Post-spread, Cyango field name | Prop applied after the spread (e.g. `textColor` → UIKit `color`; `backgroundColor` + `backgroundOpacity` → `withOpacity()`). Fully writable like A — use the documented entity field name, not the UIKit prop name. |
| **C** — Immutable | Literal or asset | Hardcoded value or value from a linked asset. No MCP-only change without an editor change. |

For layout issues after `add_entities` / `update_entities`, inspect parent chain constraints (size, overflow, fixed heights, caps) before changing child properties.

---

### `GUI_CONTAINER`

**Overridable (A):**

| Property | Default | When to override |
|----------|---------|------------------|
| `width` | `150` | Almost always — `"100%"`, `"auto"`, or explicit px |
| `height` | `150` | Almost always — `"100%"`, `"auto"`, or explicit px |
| `overflow` | `"scroll"` | `"visible"` when children must not be clipped |
| `flexDirection` | `"column"` | `"row"` for horizontal layouts |
| `flexWrap` | `"no-wrap"` | — |
| `alignItems` | `"flex-start"` | `"center"`, `"stretch"`, etc. |
| `justifyContent` | `"flex-start"` | `"center"`, `"space-between"`, etc. |
| `alignContent` | `"flex-start"` | — |
| `scrollbarWidth` | `8` | `0` to hide scrollbar track |
| `scrollbarBorderRadius` | `4` | — |
| `positionType` | `"relative"` | `"absolute"` for overlays |

**Specific fields (B):**

| Visual | Fields to set | Notes |
|--------|---------------|-------|
| Background | `backgroundColor` + `backgroundOpacity` | Default base: black; default opacity: 1 |
| Border | `borderColor` + `borderOpacity` | Default base: black; default opacity: 1 |
| Scrollbar | `scrollbarColor` + `scrollbarOpacity` | Default base: gray; default opacity: 1 |
| Pointer events | `backgroundOpacity` | Auto `"none"` when `backgroundOpacity === 0`, else `"listener"` — `pointerEvents` in GUI data cannot override this |

**Common mistakes:**
- **Clipped children:** default `overflow: "scroll"` clips anything outside the 150×150 box. Fix: always set `overflow: "visible"` unless you explicitly want scrolling.
- **Transparent container still blocks clicks:** if you set `backgroundColor` (any color) but leave `backgroundOpacity` unset, it defaults to `1` (fully opaque). The container is invisible to the eye but blocks pointer events. Fix: to make a container truly transparent and non-blocking, set `backgroundOpacity: 0` — this also triggers the `pointerEvents: "none"` automatic behavior.

---

### `GUI_TEXT`

**Overridable (A):**

| Property | Default | When to override |
|----------|---------|------------------|
| `fontSize` | `20` | Per design |
| `textAlign` | `"left"` | `"center"` / `"right"` — needs explicit `width` to take effect |
| `verticalAlign` | `"top"` | — |
| `lineHeight` | `"24px"` | Keep ≥ `fontSize` + a few px to avoid clipping (e.g. `fontSize: 32` → `"38px"`) |
| `letterSpacing` | `1` | — |
| `wordBreak` | `"break-word"` | — |
| `whiteSpace` | `"pre"` | **`"normal"`** or `"pre-line"` for wrapping — `"pre"` prevents all wrapping |
| `width` | `"100%"` | — |
| `height` | `"auto"` | — |
| `positionType` | `"relative"` | — |
| `pointerEvents` | `"listener"` | — |

**Specific fields (B):**

| Entity field | UIKit mapping | Notes |
|--------------|---------------|-------|
| `textColor` | `color` (after spread) | Use `textColor` for visible text color. Setting `color` in GUI data does not control text color for this component. |

**Immutable (C):**

| What | Value / source |
|------|----------------|
| `fontWeight` | Fixed `"medium"` |
| `fontFamily` | Linked font asset id, else `"arial"` |

**Localization (not A/B/C):**

| Field | Rule |
|-------|------|
| `text` | `{ "en-US": "…" }` — key must be `"en-US"` (hyphen, not underscore). |

---

### `GUI_IMAGE`

**Overridable (A):**

| Property | Default | When to override |
|----------|---------|------------------|
| `keepAspectRatio` | `true` | — |
| `objectFit` | `"cover"` | `"fill"` to stretch |
| `positionType` | `"relative"` | — |
| `pointerEvents` | `"listener"` | — |

No default `width` / `height` in JSX — size comes from flex layout or the asset's natural dimensions unless you set them in GUI data.

**Specific fields (B):**

| Visual | Fields | Notes |
|--------|--------|-------|
| Border | `borderColor` + `borderOpacity` | Same `withOpacity` pattern as `GUI_CONTAINER`. |

**Immutable (C):**

| What | Behavior |
|------|----------|
| `src` | From linked image asset URL; `gui.src` is ignored |
| `cursor` | Fixed `"auto"` |

---

### `GUI_INPUT`

**Overridable (A):**

| Property | Default | When to override |
|----------|---------|------------------|
| `width` | `150` | Set to layout width |
| `height` | `35` | — |
| `fontSize` | `20` | — |
| `lineHeight` | `24` (number — differs from `GUI_TEXT`'s `"24px"` string) | — |
| `letterSpacing` | `1` | — |
| `textAlign` | `"left"` | — |
| `verticalAlign` | `"top"` | — |
| `wordBreak` | `"break-word"` | — |
| `type` | `"text"` | `"password"` for password fields |
| `disabled` | `false` | — |
| `backgroundColor` | white | — |
| `borderColor` | white | — |
| `positionType` | `"relative"` | — |

**Specific fields (B):**

| Entity field | UIKit mapping | Notes |
|--------------|---------------|-------|
| `textColor` | `color` (after spread) | Use for input text color |

**Immutable (C):**

| What | Notes |
|------|-------|
| `caretColor` | Fixed in component |
| `selectionColor` | Fixed in component; not in `IGUIProperties` |

---

### `GUI_ICON`

**Overridable (A):**

| Property | Default | When to override |
|----------|---------|------------------|
| `positionType` | `"relative"` | — |
| `color` (Lucide stroke) | black | Any stroke color |

**Specific fields (B):**

| Visual | Fields to set | Notes |
|--------|---------------|-------|
| Size | `iconSize` | Default `30`. `width` / `height` in GUI data **do not** control Lucide icon size — only `iconSize` does |
| Which icon | `iconSrc` | Lucide icon name in PascalCase (e.g. `"X"`, `"ChevronLeft"`, `"Play"`). The whole Lucide set ships with the runtime — no asset, upload, or SVG. Invalid or empty → `ArrowRight`, so a typo fails silently as an arrow |
| Background fill | `backgroundColor` + `backgroundOpacity` | Default `backgroundOpacity` is **0** (transparent) |
| Border | `borderColor` + `borderOpacity` | — |

---

### `GUI_VECTOR`

**Overridable (A):**

| Property | Default | When to override |
|----------|---------|------------------|
| `width` | `150` | SVG display width |
| `height` | `150` | SVG display height |
| `keepAspectRatio` | `true` | — |
| `opacity` | `1` | — |
| `pointerEvents` | `"listener"` | — |

**Immutable (C):**

| What | Behavior |
|------|----------|
| `src` | Linked SVG asset URL, or built-in placeholder if no asset is linked |

---

### `GUI_VIDEO`

Outer `Container` is driven by entity GUI data. Inner `Video` element is fixed in code.

**Overridable (A) — outer container:**

| Property | Default | When to override |
|----------|---------|------------------|
| `flexDirection` | `"column"` | — |
| `overflow` | `"scroll"` | `"visible"` if not scrollable |
| `scrollbarColor` | gray | — |
| `scrollbarOpacity` | `1` | — |
| `scrollbarWidth` | `8` | — |
| `scrollbarBorderRadius` | `4` | — |
| `borderColor` | black | — |
| `borderOpacity` | `1` | — |
| `positionType` | `"relative"` | — |

No default `width` / `height` on the outer wrapper — set both in GUI data or the container collapses.

**Immutable (C) — inner `Video`:**

| Aspect | Value |
|--------|-------|
| Layout | Fills container (`inset: 0`) |
| `objectFit` | `"cover"` |
| `keepAspectRatio` | `true` |
| `controls` | `false` |
| `crossOrigin` | `"anonymous"` |
| `src` | Linked video asset (or editor fallback when unset) |

---

### `GUI_CHECKBOX` / `GUI_SWITCH`

**Overridable (A):**

| Aspect | Details |
|--------|---------|
| Spread | `{...nearestBreakpointAndState}` is merged into `@react-three/uikit-default` `Checkbox` / `Switch` |
| Typical fields | `checked`, `defaultChecked`, `disabled`, plus any styling props the kit accepts through the spread |

**Specific fields (B):** No separate Cyango post-spread remapping (unlike `textColor` on text) — all configurable props come through the spread in **A**.

**Immutable (C):**

| Aspect | Details |
|--------|---------|
| Kit defaults | Base layout and visuals come from `@react-three/uikit-default` unless overridden via **A** |

---

### `GUI_DROPDOWN`

A trigger button (icon + background) that opens a list on click. Items are driven by `actions.currentValue`, not `gui`.

**Overridable (A):**

| Property | Default | When to override |
|----------|---------|------------------|
| `width` | `30` | — |
| `height` | `30` | — |
| `borderRadius` | `20` | — |
| `alignItems` | `"center"` | — |
| `justifyContent` | `"center"` | — |
| `backgroundColor` | `"transparent"` | — |

**Specific fields (B):**

| Field | Role |
|-------|------|
| `iconSrc` | Lucide icon name for the trigger |
| `color` | Icon stroke color |

**Items (data source, not `gui`):**

| Source | Behavior |
|--------|----------|
| `actions.currentValue` | Each `IItem<IAction>` becomes a list row — add / edit items here, not under `gui` |

---

### `GUI_SCREEN`

Rendered as `Fullscreen` (always 100% viewport).

**Overridable (A) — inner wrapper, pre-spread:**

| Property | Default |
|----------|---------|
| `flexDirection` | `"column"` |
| `flexWrap` | `"no-wrap"` |
| `alignItems` | `"flex-start"` |
| `justifyContent` | `"flex-start"` |
| `alignContent` | `"flex-start"` |

**Immutable (C) — forced after spread:**

| Property | Forced value | Note |
|----------|--------------|------|
| `pointerEvents` | `"none"` | Cannot be overridden |
| `width` | `"100%"` | Cannot be resized |

`GUI_SCREEN` is the full-viewport root for screen-space UI — do not attempt to size or position it.

---

### Minimum to set by entity type

| Entity type | Almost always set | If omitted |
|-------------|-------------------|------------|
| `GUI_CONTAINER` | `width`, `height`, `overflow` | 150×150, scroll clips children |
| `GUI_TEXT` | `text`; `whiteSpace: "normal"` if wrapping; `lineHeight` ≥ `fontSize` | Placeholder text; no wrap; tall glyphs clipped |
| `GUI_IMAGE` | `width` / `height` for a fixed-size box | Follows flex / asset natural size |
| `GUI_INPUT` | `width` (and `height` if not 35) | 150×35 |
| `GUI_ICON` | `iconSrc`, `iconSize` | ArrowRight at 30px — a wrong `iconSrc` looks like this, not like an error |
| `GUI_VECTOR` | `width`, `height` | 150×150 |
| `GUI_VIDEO` | `width`, `height` | Container collapses |
| `GUI_CHECKBOX` | `checked` or `defaultChecked` | — |
| `GUI_SWITCH` | `checked` or `defaultChecked` | — |
| `GUI_DROPDOWN` | items in `actions.currentValue` | Empty list on open |
| `GUI_SCREEN` | (usually nothing) | Fullscreen root |
