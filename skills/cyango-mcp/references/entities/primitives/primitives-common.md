# Primitive entities

**`PRIMITIVE_*`** types are mesh primitives sharing **`geometry`**, **`material`**, and **transform** as `IAnimation<…>` tracks in the story model.

---

## Studio canvas vs story JSON (read this first)

- In the **cloud editor**, the live mesh uses **fixed** Three.js / R3F geometry for each `EntityTypes` case (e.g. `boxGeometry` with default 1×1×1, `sphereGeometry` with radius `0.5` in local units, etc.). **Those args are not read from `entity.geometry.currentValue` in the current implementation.**
- **Visible size in the editor** is therefore driven mainly by **`scale`** (and the per-type “normalized” base mesh the code comments describe), not by `geometry.currentValue.radius` / `width` / `height`.

**Practical MCP rule:** To make a primitive **larger or smaller in the viewport**, set **`scale`** (`add_entities.scale` or `overrides.scale` / `scale.currentValue`). Treat **`geometry`** fields as **model/timeline/export metadata** unless you confirm the playback/runtime stack reads them for your scene type.

---

## Geometry and material fields

`IEntityGeometry`, `IEntityMaterial` and the `GeometryPrimitive` enum are in [cyango-shared-types.md](../../cyango-shared-types.md). Two things to note when you read them: the radius fields (`radius`, `radiusBottom`, `radiusTop`) are typed **`string`**, not number, and `materialType` is required and must match `MaterialTypes`.

`position` / `rotation` / `scale` each hold a plain `[number, number, number]` at `*.currentValue`.

---

## MCP paths and merge behavior

- Patches: `geometry.currentValue.*`, `material.currentValue.*`, `position.currentValue`, `rotation.currentValue`, `scale.currentValue`.
- **`add_entities` / `overrides`:** The MCP server **deep-merges** these tracks into per-type defaults (typed primitive branches supply canonical `primitive` + defaults; your patch wins per-key). Partial **`visibility`** / **`layer`** / **`hdr`** / **`webcam`** patches are merged rather than replacing whole objects.

---

## Per-type notes

| Type | `GeometryPrimitive` | Key geometry fields |
|------|---------------------|---------------------|
| `PRIMITIVE_CUBE` | `BOX` | `width`, `height` (depth via scale or third dimension). |
| `PRIMITIVE_SPHERE` | `SPHERE` | `radius` (string), `segmentsWidth`, `segmentsHeight`. `phiLength`/`thetaLength` for partial spheres. |
| `PRIMITIVE_CYLINDER` | `CYLINDER` | `radius` (or top/bottom if truncated), `height`, segments. |
| `PRIMITIVE_PLANE` | `PLANE` | `width`, `height`, segment subdivisions. |
| `PRIMITIVE_CONE` | `CONE` | `radiusBottom`, `radiusTop`, `height`, segments. |
| `PRIMITIVE_RING` | `RING` | Inner/outer radii, `segmentsWidth`, `thetaLength` for partial ring. |
| `PRIMITIVE_CIRCLE` | `CIRCLE` | `radius`, `thetaLength`, `thetaStart`. |
| `PRIMITIVE_ROUNDED_PLANE` | `PLANE` | Same as plane + rounded-corner parameters (check `get_entity` for exact keys). |
| `PRIMITIVE_CURVED_PLANE` | `PLANE` | Same as plane + curvature/arc fields (check `get_entity` for exact keys). |
| `PRIMITIVE_CAPSULE` | *(implied by entityType)* | `radius` (string), `height` (numeric). No `CAPSULE` in `GeometryPrimitive` enum — mesh is built from entityType. Often paired with `physics` for character controllers. |

For **physics** colliders that depend on dimensions, align **`scale`** (and physics shape settings) with the intent rather than assuming JSON `geometry` drives the Studio mesh.
