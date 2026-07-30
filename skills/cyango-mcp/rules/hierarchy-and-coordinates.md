# Hierarchy, coordinates, and scene structure

## Coordinate system

- **Axes**: Y-up, X-right, Z-forward (right-handed).
- **Units**: Meters (1 unit ≈ 1 m).
- **Position**: `[x, y, z]`.
- **Rotation**: `[x, y, z]` in **radians**.
- **Scale**: `[x, y, z]` (1 = identity).

## Scene structure and parent-child relations

Every entity either sits at the scene root or is a child of another entity, controlled by `parentEntityId`:

| Placement | `parentEntityId` | Coordinate space |
|-----------|------------------|-----------------|
| Scene root | `""` or omit | World |
| Child of another entity | Parent's entity id | Local (relative to parent) |

Scene-root entities use world coordinates directly. Child entities use **local** coordinates — their position, rotation, and scale are all expressed relative to the parent, not the world origin.

**The parent must be a type that accepts children**: `GROUP`, `GROUP_BOX`, `PRIMITIVE_*`, `GUI_CONTAINER`, `GUI_SCREEN`, `FLAT_IMAGE`, `FLAT_VIDEO`, `TEXT_3D*`, `CAMERA`, `PLAYER`, `WEBCAM`, `FACE_MESH`. Everything else is a leaf — a `SPLAT`, model, light, panorama or audio emitter never takes children, and asking for one lands the entity at the scene root instead. Wrap the pieces in a `GROUP` and make them siblings. See [which types accept children](../references/entities/common.md#which-types-accept-children).

## Reparenting existing entities

Use `update_entities` for reparenting after create:

- **To scene root**: `propertyPath: "parentEntityId"`, `value: ""`.
- **To another parent**: `propertyPath: "parentEntityId"`, `value: "<targetEntityId>"`.
- **Batching**: put all reparent updates in one `update_entities` call.

Do **not** patch `children` paths directly; hierarchy ownership should be driven by `parentEntityId` and reconciled by the editor reparent flow.

Current Studio behavior keeps **local** transform values on reparent (position/rotation/scale stay as-is), so world pose may change.

## Transform inheritance and calculation

All three transform components compose through the hierarchy:

- **Position**: A child's world position is the parent's world position plus the child's local position, after applying the parent's world rotation and scale. When the parent has no rotation or scale, the shortcut is `local ≈ world − parentWorldPos`. For rotated or scaled parents, transform `(worldPos − parentWorldPos)` by the **inverse** of the parent's world rotation/scale to get the correct local position — use matrix/quaternion math when precision matters.
- **Rotation**: A child's orientation is in the parent's frame. World rotation is the composition of all ancestor rotations up the chain.
- **Scale**: World scale is the component-wise product of all ancestor scales. A parent scaled to `[2, 2, 2]` doubles every child's effective world size.

## Batch creation with `add_entities`

Use a **single `add_entities` call** for entire subtrees. Two mechanisms for expressing the parent link:

- **`parentEntityId`** — use when the parent already exists in the scene (pass its id, or `""` for scene root).
- **`parentIndex`** — use when the parent is in the **same batch**, identified by its 0-based index in the `entities` array.

Rules:
1. Always order **parents before children** in the array.
2. Each row references either an existing id (`parentEntityId`) or a **lower index** in the current batch (`parentIndex`).
3. Deeper levels work the same way: a row at index 3 can reference a parent at index 1, which itself referenced index 0.

Do not flatten a natural hierarchy — express it with `parentIndex` / ids as intended.

### Composite subtrees example

Typical pattern for a composite (building, machine, grouped panel):

- **Row 0**: root `GROUP` at world position, no parent (`parentEntityId` omitted or `""`).
- **Row 1–N**: child rows using `parentIndex: 0` (or the index of their direct parent) with **local** `position` / `rotation` / `scale` relative to that parent.
- **Deeper levels**: a sub-group at index 2 can have children at index 3+ pointing `parentIndex: 2`.

## Readable composite structure

Avoid piling primitives directly on the scene root when they form one logical object.

1. **Root `GROUP`** per composite (building, machine, panel assembly, …).
2. **Child `GROUP`s** for logical parts (sections, towers, sub-assemblies).
3. **Optional** sub-groups for finer grouping.
4. **Leaves** (primitives, meshes, GUI nodes, …) under the correct group.

Prefer **sibling** groups under a root over unnecessary deep chains (A→B→C→D) unless the design specifically requires that dependency.

## Reference scale

- Human eye height ≈ 1.6 m.
- Default primitive cube ≈ 1×1×1 m.
