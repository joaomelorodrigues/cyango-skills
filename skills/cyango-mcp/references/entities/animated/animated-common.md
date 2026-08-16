# Frame-animated entities (`LOTTIE`, `SPRITE`)

Two entity types play a frame sequence that is neither a video nor a skeletal 3D clip. Both keep their playback in **`animations.currentValue`** (the same `IEntityAnimation[]` shape `CUSTOM_3D_MODEL` uses), so the timeline and entity actions drive all three the same way.

| Type | Source asset | Config block | Renders as |
|------|--------------|--------------|------------|
| `LOTTIE` | Bodymovin JSON (`AssetCategories.LOTTIE`) | `lottie?: IEntityLottie` | uikit `Image` (`GUI2D_Lottie`) — rasterised every frame |
| `SPRITE` | Image spritesheet | `spritesheet?: IEntitySpritesheet` | Textured sprite mesh |

---

## `LOTTIE`

`IEntityLottie`:

| Field | Role |
|-------|------|
| `resolution` | Texture edge in **pixels** (default `512`). The animation is redrawn and re-uploaded every frame, so this is the direct quality/cost dial. It is an absolute size, **not** a multiplier of the artboard. |

**It is a GUI-stack entity.** `LOTTIE` renders through `GUI2D_Lottie`, so it behaves like `GUI_IMAGE`:

- Parent it under `GUI_SCREEN` / `GUI_CONTAINER` for screen-space UI, or under a 3D parent for a world-space panel (the editor wraps it in the GUI-3D wrapper).
- Size, position, padding/margin, background and border come from **`gui.currentValue.<breakpoint>.<state>.<prop>`**, not from `geometry`. Read [gui-properties.md](../gui/gui-properties.md) before setting them.
- Transform `scale` stays `[1, 1, 1]` for world-space placement — size it with GUI `width` / `height`.
- The layout box follows the artboard aspect ratio, so a non-square animation is not squashed.

Asset upload: a Lottie is a plain `.json`, so the editor decides the category by **reading the file**, not the extension. A `.json` that is not a Bodymovin document lands in another category (font or plain data) — check `assetCategory` on the uploaded asset before inserting.

---

## `SPRITE`

`IEntitySpritesheet`:

| Field | Role |
|-------|------|
| `cols` | Columns in the uniform grid. |
| `rows` | Rows in the uniform grid. |
| `fps` | Default fps for clips that do not set their own. |

Clips can select a frame range within the grid via the `SPRITE`-only fields on `IEntityAnimation`: `startFrame`, `endFrame`, `fps`. These are ignored for `CUSTOM_3D_MODEL` clips.

`SPRITE` renders as a 3D mesh (geometry + material defaults apply), unlike `LOTTIE`.

---

## Clip shape (`animations.currentValue`)

Creation default for both types is one clip:

```json
{ "id": "clip_<uuid>", "name": "Main", "loop": 2201, "play": true }
```

`loop` is the numeric three.js constant (`2200` = LoopOnce, `2201` = LoopRepeat, `2202` = LoopPingPong).

`animations` is **replaced wholesale** by an `overrides.animations` patch or an `update_entities` write to `animations.currentValue` — send the complete clip array, not a partial one.

---

## Choosing between them

| Need | Use |
|------|-----|
| Vector animation, sharp at any zoom, few-KB asset, UI-style motion | `LOTTIE` |
| Pre-rendered raster frames (explosions, characters, effects) already baked into a sheet | `SPRITE` |
| Video content with audio | `GUI_VIDEO` / `FLAT_VIDEO` / `PANORAMA_VIDEO` |
| Skeletal / node animation from a GLB | `CUSTOM_3D_MODEL` (see [models-common.md](../models/models-common.md)) |

Cost note: `LOTTIE` redraws and re-uploads a `resolution`×`resolution` texture every frame. Many simultaneous Lotties at high resolution are expensive — drop `resolution` before adding more.

---

## MCP paths

- `lottie.resolution`
- `spritesheet.cols` / `spritesheet.rows` / `spritesheet.fps`
- `animations.currentValue` (full clip array)
- `gui.currentValue.desktop.default.width` / `height` (LOTTIE sizing, same slots as `GUI_IMAGE`)
