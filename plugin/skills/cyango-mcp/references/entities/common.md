# Common entity model

Every scene has an **`entities[]`** array. Each item is an **`IEntity`**: a typed object with `entityType`, identity, hierarchy, optional `IAnimation<T>` tracks, and type-specific payloads (`gui`, `geometry`, `light`, …).

Hierarchy uses `parentEntityId` and local-vs-world transform semantics.

Animation/timeline fields use `IAnimation<T>` wrappers (`currentValue`, optional keyframes, repeat).

Actions are attached as `actions.currentValue` (`IAction[]`).

All 48 `IEntity` fields are in [cyango-shared-types.md](../cyango-shared-types.md), including `visibility` (`IVisibility`), `physics`, `prefab`, `mapProperties` and the rest. This page covers the parts where the runtime does something the field name does not imply.

---

## Which types accept children

**This section is the single source for the list. Every other file names the rule and links here.**

Parenting is not universal. Exactly these types can hold children:

`GROUP`, `GROUP_BOX`, `PRIMITIVE_*`, `GUI_CONTAINER`, `GUI_SCREEN`, `FLAT_IMAGE`, `FLAT_VIDEO`, `TEXT_3D`, `TEXT_3D_VIDEO`, `CAMERA`, `PLAYER`, `WEBCAM`, `FACE_MESH`, `GUI_CUSTOM_CODE`.

Every other type is a **leaf**: `SPLAT`, `CUSTOM_3D_MODEL`, all `*_LIGHT`, `PANORAMA*`, `AUDIO_*`, `HDR`, `SKYBOX`, `MAP_*`, `LOTTIE`, `SPRITE`, `SUBTITLE`, and the leaf `GUI_*` types. The rule lives in `PARENT_CAPABLE_ENTITY_TYPES` in `cyango-shared` and is enforced on every write path: the scene tree refuses the drop, paste and create skip the parent, and the MCP bridge places the entity at the scene root instead.

To pair a leaf with labels, hotspots or colliders, put them in a `GROUP` as **siblings**.

Failure mode when you ignore this: the write reports success, `parentEntityId` comes back as `""`, and the entity sits at the scene root.

---

## Transforms & animation

Most "live" fields wrap their value in `IAnimation<T>`: `currentValue` plus optional `keyframes`, `repeat`, `excludeFromMasterTimeline`. That covers `position` / `rotation` / `scale` (3-number arrays), `geometry`, `material`, `media`, `gui`, `light`, `camera`, `player` and `actions`.

Two consequences worth remembering: a patch path almost always goes through `.currentValue`, and `actions` is a keyed track like any other.

---

## Visibility

`visibility` is an `IVisibility`, the same shape scenes use: optional booleans plus one language list that hide this entity in specific contexts. **An unset flag does not apply**, so hiding on one device never implies anything about the others. The full flag list is in [cyango-shared-types.md](../cyango-shared-types.md).

`hiddenTotally` is the strongest hide and wins over every other flag.

---

## Render order

`renderOrder` is an optional top-level number on `IEntity`, a Three.js draw-order override where higher finite numbers draw later within the same opaque/transparent pass. Use it only when draw order needs an explicit override, for example overlapping transparent planes, GUI-in-world panels, splats, or media surfaces.

Important behavior:

- Unset means "use the renderer's per-entity default"; do not write `0` unless the user explicitly wants to override the default.
- Child entities inherit the nearest parent/group effective `renderOrder` unless the child sets its own finite value.
- This does not change timeline stacking, GUI flex layout, or transform depth. Do not use it as a replacement for position/scale/layout.
- In Studio, the editor control is in the Visibility section because it affects whether an entity visually appears above/below others.

Use `update_entities` with `propertyPath: "renderOrder"` to set or clear it.

---

## Fields that behave unexpectedly

| Field | What the type does not tell you |
|-------|--------------------------------|
| `assetDomElementId` | A composite id, `asset.id + entity.id`, never a bare asset id. Modal payloads use the same rule. |
| `animations` | Replaced wholesale on patch. Send the complete clip array or the old clips are gone. |
| `resizeToUnitBox` | Honoured by `CUSTOM_3D_MODEL` and the GUI-3D wrapper only. Other types ignore it, and unset keeps each renderer's existing behavior. |
| `layer` / `handles` | Editor UI state. Writing them changes nothing in the viewport. |

---

## Per-family docs

Each row names the file that covers that family's behaviour, defaults and gotchas.

| Family | File |
|--------|------|
| GUI (`GUI_*`) | [gui/gui-common.md](gui/gui-common.md), fields in [gui/gui-properties.md](gui/gui-properties.md) |
| Primitives (`PRIMITIVE_*`) | [primitives/primitives-common.md](primitives/primitives-common.md) |
| Lights (`*_LIGHT`) | [lights/lights-common.md](lights/lights-common.md) |
| Models & splats (`CUSTOM_3D_MODEL`, `SPLAT`) | [models/models-common.md](models/models-common.md) |
| Frame animation (`LOTTIE`, `SPRITE`) | [animated/animated-common.md](animated/animated-common.md) |
| Structure, panorama, 3D text, audio, environment, camera/player/webcam/face, maps, subtitle | [small-families.md](small-families.md) |

Creation defaults for every non-GUI type: [non-gui-defaults.md](non-gui-defaults.md).

---

## `MaterialTypes`

| Value | Role |
|-------|------|
| `NONE` | — |
| `COLORKEY` | Chroma-style keying. |
| `ALPHA` | Alpha channel handling. |
| `LEFT_RIGHT` / `TOP_BOTTOM` | Stereo layouts. |
| `FLAT` | MeshBasic-style. |
| `STANDARD` | PBR-style. |
| `PHONG` / `LAMBERT` | Classic lit materials. |
| `OCCLUSION` | Depth/occlusion pass helper. |
| `TRANSPARENT` | Transparent mesh. |
