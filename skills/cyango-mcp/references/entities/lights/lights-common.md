# Light entities

All `*_LIGHT` types use **`light?: IAnimation<IEntityLight>`** for color and photometric fields, plus transform and optional visibility.

---

## `IEntityLight`

| Field | Notes |
|-------|-------|
| `lightColor` | Hex / CSS color string. |
| `intensity` | Brightness multiplier. |
| `distance` | Range where intensity falls off (point / spot). |
| `decay` | Falloff curve (physically correct lights). |
| `angle` | Spot outer cone (radians). |
| `penumbra` | Spot edge softness (0–1). |
| `attenuation` | Beam falloff. `VOLUMETRIC_SPOT_LIGHT` only (default `5`); other types ignore it. |
| `anglePower` | Beam cone shaping. `VOLUMETRIC_SPOT_LIGHT` only (default `5`). |

Not every field applies to every light type — see table below.

---

## Shadows

Shadow fields live on the same `IEntityLight` block and apply only to shadow-casting types (`DIRECTIONAL_LIGHT`, `SPOT_LIGHT`, `POINT_LIGHT`, `TUBE_LIGHT`). Unset fields fall back to per-type renderer defaults.

| Field | Role |
|-------|------|
| `castShadow` | Whether this light casts shadows at all. Defaults to **on**. |
| `shadowMapSize` | Square shadow-map resolution: `512` \| `1024` \| `2048` \| `4096`. Higher = sharper and more expensive. |
| `shadowRadius` | PCF blur radius — higher is softer. |
| `shadowBias` | Depth bias against self-shadowing acne (advanced). |
| `shadowNormalBias` | Offset along the surface normal — the better acne fix on flat surfaces (advanced). |
| `shadowArea` | Directional only: symmetric orthographic frustum half-extent. Too large = blocky shadows, too small = shadows cut off. |

> **Scene prerequisite**: nothing casts a shadow until the scene has `shadowsEnabled: true`. Set it with `update_scene(s)` in the same pass that turns on `castShadow`, the same way scene `physics.enabled` gates entity physics.

---

## MCP paths

`light.currentValue.intensity`, `light.currentValue.lightColor`, `light.currentValue.castShadow`, `light.currentValue.shadowMapSize`, `position.currentValue`, etc.

---

## Per-type notes

| Type | Role | Relevant fields | Transform notes |
|------|------|-----------------|-----------------|
| `AMBIENT_LIGHT` | Uniform fill, no direction/shadows | `lightColor`, `intensity` | Position usually irrelevant for lighting. |
| `POINT_LIGHT` | Omnidirectional, distance falloff | `lightColor`, `intensity`, `distance`, `decay` | Position matters; rotation has no effect. |
| `SPOT_LIGHT` | Cone spotlight | `lightColor`, `intensity`, `distance`, `decay`, `angle`, `penumbra` | Position = origin; rotation aims the cone. |
| `DIRECTIONAL_LIGHT` | Parallel sun rays, infinite distance | `lightColor`, `intensity` | Rotation sets direction; position usually irrelevant. |
| `VOLUMETRIC_SPOT_LIGHT` | Visible volumetric beam | Same as spot + `anglePower`/`attenuation` for beam shape | Same as spot. |
| `TUBE_LIGHT` | Linear / tube area light | `lightColor`, `intensity`, `distance`, decay along tube | Scale or geometry may define tube extent — check `get_entity`. |
