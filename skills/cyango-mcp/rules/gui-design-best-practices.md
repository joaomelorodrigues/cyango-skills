# GUI design best practices

## Screen-following GUI

To make GUI follow the viewport, **parent it under the scene's `GUI_SCREEN`**. This is the standard approach and works in any scene type.

As an option, fully 2D experiences (quizzes, menus, onboarding flows) can also be built inside a `TOUR_3D` scene by parenting the root `GUI_CONTAINER` under its `GUI_SCREEN`. This is not a recommended default. Pick the scene type that best fits the task. In that setup:

- `width: "100%"` resolves correctly with `GUI_SCREEN` as the ancestor anchor.
- For multi-page or multi-state flows, create one `GUI_CONTAINER` per state and toggle visibility with `SHOW_ENTITY` / `HIDE_ENTITY` actions; keep only the first one visible initially.

---

## World-space panels in 3D scenes

For interactive panels **placed in the 3D environment** (not screen-following):

1. **`GUI_CONTAINER`** at the desired world position/rotation, the flex wrapper and root of the panel.
2. **`GUI_TEXT`**, other `GUI_*` entities nested under that container.

If the panel also contains non-GUI entities, wrap the `GUI_CONTAINER` and those entities inside a `GROUP`.

**Scale rule:** keep world-space `GUI_*` transforms at `scale.currentValue: [1, 1, 1]` unless the user explicitly asks for transform scaling. Size world GUI through the `width` / `height` slots. The runtime already interprets GUI layout units for the UIKit panel, so an identity transform keeps hit targets, text readability and later edits predictable. Micro-scaling the transform to fake pixel units (`scale: [0.004, 0.004, 0.004]`) breaks all three.

---

## Icons: use `GUI_ICON`, never a glyph in `GUI_TEXT`

`GUI_ICON` draws from a **bundled Lucide set**: no asset, no upload, no SVG. Set `iconSrc` to the icon's name and `iconSize` to its pixel size. An unknown or empty name silently falls back to `ArrowRight`, so spell it exactly.

**Never** represent an icon as a character in `GUI_TEXT` (`"×"`, `"✕"`, `"➔"`, `"▶"`, `"☰"`). Glyphs depend on font coverage, sit on a text baseline instead of centring in their box, scale with `fontSize`/`lineHeight` rather than `iconSize`, and read as a typo when the font lacks them. Reach for `GUI_TEXT` only when the label is actual words.

**Close-button recipe** (the same shape works for any icon button):

```
GUI_CONTAINER            ← the hit target: width/height ~44–60, borderRadius, backgroundColor,
  │                        alignItems "center", justifyContent "center", hover state, close action
  └── GUI_ICON           ← iconSrc "X", iconSize ~24, color
```

Put the action on whichever entity the user clicks; the container is the better target because it gives a comfortable hit area and a hover affordance. `GUI_ICON` accepts clicks too, so a bare icon with an action on it is fine when no chrome is wanted.

Common names (Lucide, PascalCase):

| Purpose | `iconSrc` |
|---------|-----------|
| Close / dismiss | `X`, `XCircle` |
| Back / forward | `ChevronLeft`, `ChevronRight`, `ArrowLeft`, `ArrowRight` |
| Menu / more | `Menu`, `EllipsisVertical` |
| Media | `Play`, `Pause`, `Volume2`, `VolumeX` |
| Info / help | `Info`, `CircleHelp` |
| Navigation | `MapPin`, `Compass`, `Home` |
| Fullscreen | `Maximize`, `Minimize` |

> **Sizing gotcha**: `width` / `height` do **not** size a `GUI_ICON`. Only `iconSize` does. Set the box on the parent container instead.

---

## Recipes

Five compositions that cover most GUI asks. Each shows the entity tree and the `desktop.default` slot for each node; the full `add_entities` wrapper is in [payloads.md](../references/payloads.md#add_entities--a-screen-space-gui-tree). Values are 1920 × 1080 pixels.

**Text button**: `GUI_CONTAINER` + `GUI_TEXT`

```json
// GUI_CONTAINER (the button; carries the action and the hover state)
{ "width": 260, "height": 64, "flexDirection": "row", "alignItems": "center",
  "justifyContent": "center", "gap": 8, "paddingX": 24,
  "backgroundColor": "#2E5AAC", "borderRadius": 12, "overflow": "visible" }
// GUI_TEXT (child)
{ "text": { "en-US": "Start tour" }, "fontSize": 18, "lineHeight": "24px", "textColor": "#FFFFFF" }
```

**Icon button**: `GUI_CONTAINER` + `GUI_ICON`

```json
// GUI_CONTAINER (square hit target)
{ "width": 48, "height": 48, "alignItems": "center", "justifyContent": "center",
  "backgroundColor": "#000000", "backgroundOpacity": 0.45, "borderRadius": 24, "overflow": "visible" }
// GUI_ICON (child): iconSize sizes it, width/height do not
{ "iconSrc": "X", "iconSize": 24, "color": "#FFFFFF" }
```

**Card / panel**: `GUI_CONTAINER` wrapper with children

```json
{ "width": 800, "height": "auto", "flexDirection": "column", "gap": 16, "padding": 32,
  "backgroundColor": "#101317", "backgroundOpacity": 0.92, "borderRadius": 16, "overflow": "visible" }
```

**Text block**: `GUI_TEXT`

```json
{ "text": { "en-US": "Body copy…" }, "fontSize": 18, "lineHeight": "26px",
  "textColor": "#E6E8EB", "width": "100%", "whiteSpace": "normal" }
```

**Image**: `GUI_IMAGE` (insert the asset with `insert_assets`, then size it)

```json
{ "width": "100%", "height": 320, "objectFit": "cover", "borderRadius": 12, "keepAspectRatio": false }
```

Hover feedback goes in the sibling slot, not a second entity: patch `desktop.hover.backgroundColor` on the container.

---

## Viewport assumption

Unless the user specifies otherwise, design for **1920 × 1080 desktop**. GUI coordinates are **1:1 viewport pixels** when GUI is parented under `GUI_SCREEN`. `width: 800` means 800 screen pixels, `fontSize: 22` means 22 px on screen. Scale every decision from that baseline.

---

## Responsive UI designs (default)

What each breakpoint is designing for. The cascade rules and the tablet-only-change trap live in [gui-desktop-first.md](gui-desktop-first.md).

| Breakpoint | Preview width | Typical adjustments |
|---|---|---|
| `desktop` | 1920 px | Base layout: full sidebars, multi-column grids, generous padding |
| `tablet` | 991 px | Narrower panels, tighter padding, smaller gaps, sometimes stack columns |
| `mobile` | 479 px | Full-width stacks, larger tap targets, reduced font sizes only when needed |

---

## Width and height rules

**Width:**

- Screen-attached GUI: `width: "100%"` is safe once the chain reaches an anchor.
- World-space panels: give the wrapper an explicit **numeric `width`** (e.g. `900`). It is the anchor for its own subtree, because there is no parent screen to resolve against.

**Height:**

Always set a **numeric `height`** on interactive and structural elements:

- **Buttons / clickable surfaces**: without an explicit height the container collapses to `padding` plus **resolved** line height. A button with `padding: 14` and `lineHeight: "22px"` auto-sizes to **~50 px**, which looks like a plain text link, not a button.
- **Headers and footers**: structural rails that the rest of the layout is measured against.
- **Icons and fixed-dimension media**: their visual footprint should never be content-driven.

Omit `height` (let it be `auto`) for content elements:

- Panel cards and section containers: they should grow with whatever is inside them.
- `GUI_TEXT` blocks: a fixed height causes overflow or clipping when text changes.
- Any container whose children are variable (conditional sections, dynamic lists).

> **Decision rule**: if the user clicks it → explicit height. If the user reads it → auto.

---

## Default sizing for 1920 × 1080 desktop

| Element | Recommended value |
|---|---|
| Standard button height | 60–80 px |
| Large / prominent button height | 80–100 px |
| Header bar height | 60–80 px |
| Card / panel width | 600–900 px |
| Card padding | 24–40 px |
| Gap between sibling elements | 12–16 px |
| Body text font size | 16–18 px |
| Heading font size | 22–32 px |

These are calibrated to 1:1 viewport pixels at 1080p. Adjust proportionally for other resolutions.

---

## Typography and layout pitfalls

- If `fontSize` is large, set `lineHeight` so **resolved** line height clears the glyphs. Use **`"…px"`**, a **multiplier** (plain number), **`%`**, or **`"auto"`** where valid (plain number = multiplier, not raw px).
- Use `whiteSpace: "normal"` for wrapping; `"pre"` prevents wrapping and can overflow.
- `GUI_TEXT` in a flex column often needs explicit width (e.g. `"100%"` of container) for `textAlign` to work.
- Prefer `overflow: "visible"` on wrappers when `"scroll"` clips content.
- World-space panels: set `backgroundColor` / `backgroundOpacity` on the wrapper so text is readable over the 3D scene; `borderRadius` for card-style panels.
- **Hover**: give interactive containers a `desktop.hover` slot so they have feedback.
- **Borders**: there is no `boxSizing` property, so borders always add to the element's dimensions. Give bordered containers explicit `width` / `minHeight` so the border doesn't shift the flex layout.
- **`pointerEvents`**: leave it unset and a container decides for itself, catching the click only when it shows a background or border, scrolls, or is interactive. Set `"none"` when that rule guesses wrong, for example a decorative overlay that does have a background but must still let clicks reach what is underneath. `"none"` removes only that box, so its children stay clickable. See [Who catches the click](../references/entities/gui/gui-properties.md#who-catches-the-click).

---

## Anchors: every percentage width needs one

An **anchor** is an ancestor with a numeric width. `width: "100%"` resolves only against an anchor, so every percentage chain has to reach one. `GUI_SCREEN` is the viewport anchor, which makes a top-level `"100%"` always safe under it. Deeper in the tree, check that the chain to the nearest anchor is unbroken.

**Recommended structure (screen-attached GUI):**

```
GUI_SCREEN                         ← viewport anchor (always 100% × 100%)
  └── Root container               width "100%", height "100%"
       └── Panel card              width 800, height "auto"  ← numeric anchor
            └── Children           width "100%", height "auto"  ← resolves to 800 − padding
```

- Give cards and modals a **fixed numeric width** so they stay a predictable, centerable size and act as the anchor for their subtree.
- Reserve `width: "100%"` on the outermost card for the case where filling the full viewport is the intent.
- When a child using `"100%"` renders at an unexpected size, trace up the hierarchy for the missing anchor.

---

## Layout troubleshooting: parent chain

When changing a child entity's layout properties has no visible effect, the problem is usually an ancestor. Walk up from the child using `get_entity` on each parent.

**Check order:** immediate parent → scroll container → `GUI_SCREEN` subtree root.

| Ancestor symptom | Likely cause | Fix |
|---|---|---|
| Parent is 150×150 | Factory default `GUI_CONTAINER` size was never overridden | Set `width`/`height` to `"auto"`, `"100%"`, or an appropriate numeric value |
| Parent has `overflow: "scroll"` | Factory default clips children to its bounds | Set `overflow: "visible"` if scrolling isn't intended |
| Parent has fixed numeric `height` | Children can't grow beyond it | Use `height: "auto"` or increase `minHeight` |
| Parent uses small `maxHeight` | Children are capped | Increase or use a large numeric cap (e.g. `10000`) |

Also confirm the child itself is not fighting per-type defaults.
