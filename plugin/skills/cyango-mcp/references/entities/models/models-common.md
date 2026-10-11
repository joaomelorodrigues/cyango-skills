# Models & splats

Types defined in `cyango-shared` (`EntityTypes`, `IEntity`, `IEntityAnimation`, `IEntitySplat`, `SplatEffectTypes`). Below matches the **models / splat** slice of the entity model.

---

## Entity types

| Type | Role | Key details |
|------|------|-------------|
| `CUSTOM_3D_MODEL` | Imported **glTF / GLB** mesh with optional skeletal animation | `animations?: IAnimation<IEntityAnimation[]>` — clips (`IEntityAnimation`: `id`, `name`, `loop`, `play` / `pause` / `stop`, fades). `geometry` / `material` per mesh; `physics` for colliders; `prefab` when the tree is a prefab instance. Asset binding via `assetDomElementId` / story assets. |
| `SPLAT` | **Gaussian splat** / point-cloud style asset (processed splat formats in the pipeline) | `splat?: IAnimation<IEntitySplat>` — see **`SplatSourceTypes`** and **`SplatEffectTypes`** below. `material.currentValue.customShaderCode` when `effects.type` is `custom`. Assets via `assetDomElementId` / uploaded scans. |

Model sub-nodes are ordinary child entities under the `CUSTOM_3D_MODEL` root (`parentEntityId` set, local transforms) — there is no separate child entity type.

---

## `IEntityAnimation` (3D model clips)

Used on **`CUSTOM_3D_MODEL`** under `animations.currentValue`.

| Field | Role |
|-------|------|
| `id` | Stable clip id. |
| `name` | Display / lookup name. |
| `blendMode` | How this clip blends with others (`AnimationBlendMode`). |
| `loop` | Loop style (`AnimationActionLoopStyles`). |
| `repetitions` | Repeat count when looping. |
| `clampWhenFinished` | Hold last frame when finished. |
| `zeroSlopeAtStart` / `zeroSlopeAtEnd` | Tangent control at clip boundaries. |
| `play` / `pause` / `stop` / `reset` / `reverse` | Playback control flags. |
| `fadeIn` / `fadeOut` | Fade durations (seconds). |

---

## `IEntitySplat` and `SplatEffectTypes`

`IEntitySplat` (on **`SPLAT`**):

| Field | Role |
|-------|------|
| `sourcePreference` | Preferred source format on the asset — `SplatSourceTypes`: `rad` \| `spz` \| `sog` \| `ply`. Unset (or missing on the asset) falls back to the renderer's default selection, RAD LoD first. Set it only when the user wants a specific format. |
| `effects.enabled` | Turn the stylized effect on or off. |
| `effects.type` | One of **`SplatEffectTypes`** (see table below). |
| `effects.intensity` | **0–1** (typical default **0.8**). Used by **`electronic`**, **`deep_meditation`**, **`waves`**, **`disintegrate`**, **`burst_disintegrate`**, **`splat_flow`** per schema comment in `cyango-shared`. |

### `SplatEffectTypes`

Enum in `cyango-shared` — the string values are the runtime tokens (e.g. `magic`, `none`). The names describe motion or shader style; the exact look is not specified anywhere in the schema. Set the one whose name matches the user's description, tell them it is a preset you cannot preview, and offer to try another if it is not what they meant. Never invent a value outside this table — an unknown token renders nothing.

| Value | Description |
|-------|-------------|
| `NONE` (`none`) | No extra stylized effect; baseline splat rendering. |
| `MAGIC` (`magic`) | "Magic"-style preset — particles / reveal. |
| `SPREAD` (`spread`) | Spread / expansion-style motion. |
| `UNROLL` (`unroll`) | Unroll / peel-style motion. |
| `TWISTER` (`twister`) | Twist / vortex-style motion. |
| `RAIN` (`rain`) | Rain-like downward motion. |
| `ELECTRONIC` (`electronic`) | Electronic-style effect; uses **`intensity`**. |
| `DEEP_MEDITATION` (`deep_meditation`) | “Deep meditation” preset; uses **`intensity`**. |
| `WAVES` (`waves`) | Wave motion; uses **`intensity`**. |
| `FLARE` (`flare`) | Flare / burst-of-light style accent. |
| `DISINTEGRATE` (`disintegrate`) | Disintegration-style dissolve; uses **`intensity`**. |
| `BURST_DISINTEGRATE` (`burst_disintegrate`) | Burst + disintegrate variant; uses **`intensity`**. |
| `SPLAT_FLOW` (`splat_flow`) | Flowing splat motion; uses **`intensity`**. |
| `CUSTOM` (`custom`) | Custom shader path — set **`material.currentValue.customShaderCode`** (and any other material fields the runtime expects). |

---

## `SPLAT` takes no children

A `SPLAT` is a [leaf](../common.md#which-types-accept-children): the scene tree refuses the drop and the MCP bridge places the entity at the scene root instead. To attach labels, hotspots, colliders or a GUI panel to a scan, wrap them together:

```
GROUP                    ← position/rotate the whole assembly here
  ├── SPLAT              ← the scan
  ├── GUI_CONTAINER      ← label, sibling of the splat
  └── CUSTOM_3D_MODEL    ← collision mesh, sibling of the splat
```

Splat collision meshes already follow this pattern — the worker emits a separate collider GLB entity rather than a child of the splat.

---

## Scale: arbitrary authored units — models may appear invisible or giant

GLB/glTF files have no enforced unit scale. A model exported in millimetres sits at `scale [1,1,1]` but is 0.001 m in world space — invisible from the default camera. One exported at 100 m swamps the entire scene.

**"Fit new entities to unit box"** (canvas toolbar → Options → sliders icon) normalises the longest side of the bounding box to 1 m on insert. It is **off by default** and applies only to entities created after enabling it; MCP's `insert_assets` calls go through the same path, but the effect is suppressed when `scale` is explicitly passed in the insert.

### How to handle invisible or scene-filling models

1. **Call `get_entity`** on the root `CUSTOM_3D_MODEL` and inspect `scale.currentValue`.
2. **Tell the user** the model may have been authored at a non-standard unit scale and that enabling "Fit new entities to unit box" (Options menu above the canvas) before re-inserting will normalise it automatically.
3. **If asked to fix it now via MCP**, apply a corrective `update_entities` scale. Use human-scale reference: eye height ≈ 1.6 m, a medium car ≈ 4 m long. A reasonable starting scale for an unknown GLB is `[0.01, 0.01, 0.01]` (millimetre-origin) or `[100, 100, 100]` (kilometre-origin) — adjust based on context.
4. **Do not silently pass `scale [1,1,1]`** when inserting unknown GLBs; omit `scale` entirely in `insert_assets` so the editor's own transform logic (including any user-enabled normalisation) can run first.

### Reference scale

| Object | Approximate world size |
|--------|----------------------|
| Human eye height | 1.6 m |
| Medium car (length) | 4 m |
| Room height | 2.5–3 m |
| Default primitive cube | 1 × 1 × 1 m |

---

## MCP paths

- **Models**: `animations.currentValue`, `geometry.currentValue`, `material.currentValue`, `physics.currentValue`, `prefab`, transforms.
- **Splats**: `splat.currentValue.sourcePreference`, `splat.currentValue.effects`, `material.currentValue` (especially `customShaderCode` for `custom`).
