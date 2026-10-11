# Light entities

All `*_LIGHT` types use **`light?: IAnimation<IEntityLight>`** for color and photometric fields, plus transform and optional visibility.

Field shapes, including every shadow field, are in [cyango-shared-types.md](../../cyango-shared-types.md), `interface IEntityLight`. What the types cannot tell you is which fields a given light type actually reads, which is the table at the bottom of this page.

---

## Shadows

Shadow fields sit on the same `IEntityLight` block and are read only by the shadow-casting types: `DIRECTIONAL_LIGHT`, `SPOT_LIGHT`, `POINT_LIGHT`, `TUBE_LIGHT`. Unset fields fall back to per-type renderer defaults, and `castShadow` defaults to **on**.

> **Scene prerequisite**: nothing casts a shadow until the scene has `shadowsEnabled: true`. Set it with `update_scene(s)` in the same pass that turns on `castShadow`, the same way scene `physics.enabled` gates entity physics.

`shadowArea` is the one to reach for when directional shadows look wrong: too large gives blocky shadows, too small cuts them off.

---

## MCP paths

`light.currentValue.intensity`, `light.currentValue.lightColor`, `light.currentValue.castShadow`, `light.currentValue.shadowMapSize`, `position.currentValue`, etc.

---

## Per-type notes

| Type | Role | Fields it reads | Transform notes |
|------|------|-----------------|-----------------|
| `AMBIENT_LIGHT` | Uniform fill, no direction or shadows | `lightColor`, `intensity` | Position usually irrelevant for lighting. |
| `POINT_LIGHT` | Omnidirectional, distance falloff | `lightColor`, `intensity`, `distance`, `decay` | Position matters; rotation has no effect. |
| `SPOT_LIGHT` | Cone spotlight | `lightColor`, `intensity`, `distance`, `decay`, `angle`, `penumbra` | Position is the origin; rotation aims the cone. |
| `DIRECTIONAL_LIGHT` | Parallel sun rays, infinite distance | `lightColor`, `intensity` | Rotation sets direction; position usually irrelevant. |
| `VOLUMETRIC_SPOT_LIGHT` | Visible volumetric beam | Spot fields plus `anglePower` and `attenuation` (both default `5`) | Same as spot. |
| `TUBE_LIGHT` | Linear / tube area light | `lightColor`, `intensity`, `distance`, decay along tube | Scale or geometry may define tube extent; check `get_entity`. |

`attenuation` and `anglePower` are read only by `VOLUMETRIC_SPOT_LIGHT`. Every other type ignores them.
