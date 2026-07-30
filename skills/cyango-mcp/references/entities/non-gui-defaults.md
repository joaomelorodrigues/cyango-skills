# Non-GUI entity creation defaults

MCP deep-merges these defaults when `add_entities` creates an entity. Keys you set in `overrides` win per-key. Defaults are **not** written to story JSON — `get_entity` only returns what you explicitly set.

---

## Base defaults (every entity)

| Track | Default |
|-------|---------|
| `position.currentValue` | `[0, 0, 0]` |
| `rotation.currentValue` | `[0, 0, 0]` |
| `scale.currentValue` | `[1, 1, 1]` |
| `actions.currentValue` | `[]` |
| `visibility.*` | all `false` / `[]` |
| `renderOrder` | unset; renderer uses per-entity default and children inherit any parent override |
| `layer` | `isLocked: false`, `duration: 0`, `isOpen: false` |

---

## Geometry + material defaults

Applied to: `PRIMITIVE_*`, `FLAT_IMAGE`, `FLAT_VIDEO`, `PANORAMA*`, `SPRITE`, `TEXT_3D`, `TEXT_3D_VIDEO`, `CUSTOM_3D_MODEL`, `SPLAT`.

> `HOTSPOT*` and `EMBED_*` entity types no longer exist. Existing stories may still carry them; never create new ones.

### `geometry.currentValue` base

| Field | Default |
|-------|---------|
| `primitive` | `PLANE` (overridden per type — see below) |
| `radius` | `"0"` |
| `radiusBottom` | `"0"` |
| `radiusTop` | `"0"` |
| `segmentsWidth` | `0` |
| `segmentsHeight` | `0` |
| `thetaLength` | `0` |
| `thetaStart` | `0` |
| `phiLength` | `0` |
| `phiStart` | `0` |

### `material.currentValue` base

| Field | Default |
|-------|---------|
| `materialType` | `FLAT` |
| `color` | `"#FFFFFF"` |
| `emissive` | `"#000000"` |
| `transparent` | `false` |
| `opacity` | `1` |
| `alphaHash` | `false` |
| `alphaToCoverage` | `false` |
| `aoMapIntensity` | `0` |
| `blendAlpha` | `0` |
| `blendColor` | `"#FFFFFF"` |

### Per-type geometry overrides

| Type | `primitive` | Extra fields |
|------|-------------|--------------|
| `PRIMITIVE_CUBE` | `BOX` | — |
| `PRIMITIVE_SPHERE` | `SPHERE` | `radius: "1"` |
| `PRIMITIVE_PLANE` | `PLANE` | — |
| `PRIMITIVE_CONE` | `CONE` | `radiusBottom: "0.5"`, `radiusTop: "0"` |
| `PRIMITIVE_CYLINDER` | `CYLINDER` | `radius: "0.5"`, `radiusBottom: "0.5"`, `radiusTop: "0.5"` |
| `PRIMITIVE_RING` | `RING` | `radius: "0.5"`, `radiusBottom: "0.25"`, `radiusTop: "0.5"` |
| `PRIMITIVE_CIRCLE` | `CIRCLE` | `radius: "0.5"` |
| `PRIMITIVE_ROUNDED_PLANE` | `PLANE` | — |
| `PRIMITIVE_CURVED_PLANE` | `PLANE` | `thetaStart: 2.356` (≈ 3π/4), `thetaLength: 1.571` (≈ π/2) |
| `PRIMITIVE_CAPSULE` | *(none — mesh built from entityType)* | `radius: "0.333…"` |

> **Viewport sizing**: geometry fields are JSON/export metadata only in Studio. Visible mesh size is driven by `scale`.

---

## Light defaults

Applied to: `AMBIENT_LIGHT`, `POINT_LIGHT`, `SPOT_LIGHT`, `DIRECTIONAL_LIGHT`, `VOLUMETRIC_SPOT_LIGHT`, `TUBE_LIGHT`.

### `light.currentValue` base

| Field | Default |
|-------|---------|
| `lightColor` | `"#FFFFFF"` |
| `intensity` | `1` |
| `angle` | `0` |
| `decay` | `0` |
| `distance` | `0` |
| `penumbra` | `0` |
| `castShadow` | `true` (only shadow-casting types act on it; the rest of the shadow block stays unset and falls back to per-type renderer defaults) |

### Per-type overrides

| Type | Override |
|------|----------|
| `AMBIENT_LIGHT` | `position: [10, 10, 10]`; light fields same as base |
| `POINT_LIGHT` | `decay: 2` |
| All others | Base light defaults only |

---

## Media defaults

Applied to: `AUDIO_GLOBAL`, `AUDIO_POSITIONAL`, `FLAT_VIDEO`, `PANORAMA_VIDEO`, `PANORAMA_180_VIDEO`, `TEXT_3D_VIDEO`, `GUI_VIDEO`.

### `media.currentValue`

| Field | Default |
|-------|---------|
| `duration` | `0` |
| `name` | `""` |
| `commandType` | `trim` |
| `controls` | `true` |
| `from` | `0` |
| `to` | `0` |
| `loop` | `false` |
| `play` | `false` |
| `speed` | `1` |
| `volume` | `1` |
| `unmuted` | `false` |

### `audio3D.currentValue` (all MEDIA_TYPES)

| Field | Default |
|-------|---------|
| `distance` | `10000` |
| `echo` | `0` |
| `noise` | `0` |
| `reverb` | `0` |
| `rolloffFactor` | `0` |

---

## Frame-animation defaults (`SPRITE`, `LOTTIE`)

Both types get one looping clip in `animations.currentValue` so the animation runs as soon as the asset is bound and the timeline can drive it:

| Field | Default |
|-------|---------|
| `id` | `clip_<uuid>` |
| `name` | `"Main"` |
| `loop` | `2201` (three.js `LoopRepeat`) |
| `play` | `true` |

`LOTTIE` additionally gets `lottie: { resolution: 512 }` — the raster edge in pixels, redrawn every frame. Raise it for large on-screen animations, lower it for many small ones; it is an absolute size, not a multiplier.

`SPRITE` reads its grid from `spritesheet` (`cols`, `rows`, `fps`), which the editor fills in on asset drop. See [animated-common.md](animated/animated-common.md).

---

## Special type defaults

### `CAMERA`

`camera.currentValue: { controls: { enabled: true } }` — `fov`, `far`, `near` intentionally absent; viewport uses `far: 10000`.

### `SKYBOX`

`skybox.currentValue: { distance: 4000 }`

### `HDR` (flat object, not `IAnimation`)

| Field | Default |
|-------|---------|
| `background` | `false` |
| `backgroundBlurriness` | `0` |
| `backgroundIntensity` | `1` |
| `environmentIntensity` | `1` |

### `WEBCAM` (flat object, not `IAnimation`)

| Field | Default |
|-------|---------|
| `cameraFacingUser` | `true` |
| `mirrored` | `true` |

### `TEXT_3D`

`text3D.currentValue`:

| Field | Default |
|-------|---------|
| `text` | `{ "en-US": "Text" }` |
| `letterSpacing` | `0` |
| `lineHeight` | `1` |
| `bevelEnabled` | `false` |
| `bevelSize` | `0.01` |
| `bevelThickness` | `0.01` |

---

## Minimum to set by type

| Type | Almost always set | If omitted |
|------|-------------------|------------|
| `PRIMITIVE_*` | `scale` for visible size; `material.currentValue.color` / `materialType` | 1×1×1 white flat mesh |
| `AMBIENT_LIGHT` | `intensity` | White fill at intensity 1; position `[10,10,10]` |
| `POINT_LIGHT` | `position`, `intensity`, `distance` | Light at origin, infinite range, decay 2 |
| `SPOT_LIGHT` | `position`, `rotation`, `angle`, `intensity` | Cone at origin pointing down default axis |
| `DIRECTIONAL_LIGHT` | `rotation`, `intensity` | Parallel rays in default direction |
| `CAMERA` | `position`, `rotation` | Camera at origin looking down −Z |
| `SKYBOX` | Usually nothing | Procedural sky at distance 4000 |
| `HDR` | Linked asset | No environment map until asset bound |
| `WEBCAM` | Usually nothing | Front-facing, mirrored |
| `TEXT_3D` | `text3D.currentValue.text`, `scale` | Reads "Text" at 1× scale |
| `LOTTIE` | Linked Lottie asset; GUI `width`/`height` on `gui.currentValue.desktop.default` | Nothing renders until a Lottie asset is bound; 512 px raster, looping "Main" clip |
| `SPRITE` | Linked spritesheet asset; `spritesheet.cols` / `rows` / `fps` | Nothing renders until asset + grid are set |
| `AUDIO_GLOBAL` | Linked media asset | No audio until asset bound |
| `AUDIO_POSITIONAL` | Linked asset, `position`, `audio3D.currentValue.distance` | No sound; emitter at origin |
