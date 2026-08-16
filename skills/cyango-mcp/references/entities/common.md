# Common entity model

Every scene has an **`entities[]`** array. Each item is an **`IEntity`**: a typed object with `entityType`, identity, hierarchy, optional `IAnimation<T>` tracks, and type-specific payloads (`gui`, `geometry`, `light`, …).

Hierarchy uses `parentEntityId` and local-vs-world transform semantics.

Animation/timeline fields use `IAnimation<T>` wrappers (`currentValue`, optional keyframes, repeat).

Actions are attached as `actions.currentValue` (`IAction[]`).

---

## Identity & hierarchy

| Field | Notes |
|-------|-------|
| `id` | Stable id (references, actions, parenting). |
| `name` | Display / editor name. |
| `sceneId` | Which scene owns this entity. |
| `entityType` | `EntityTypes` — discriminator; drives which optional blocks apply. |
| `parentEntityId` | Parent entity id, or unset for scene-root entities. |
| `children` | Optional nested `IEntity[]` (hierarchy is often flat with `parentEntityId`). |
| `locked` | Editor treats entity as non-editable. |
| `isPlaceholder` | Renders nothing; useful as group / template anchor. |

---

## Which types accept children

Parenting is not universal. These types can hold children:

`GROUP`, `GROUP_BOX`, `PRIMITIVE_*`, `GUI_CONTAINER`, `GUI_SCREEN`, `FLAT_IMAGE`, `FLAT_VIDEO`, `TEXT_3D`, `TEXT_3D_VIDEO`, `CAMERA`, `PLAYER`, `WEBCAM`, `FACE_MESH`, `GUI_CUSTOM_CODE`.

Every other type — `SPLAT`, `CUSTOM_3D_MODEL`, all `*_LIGHT`, `PANORAMA*`, `AUDIO_*`, `HDR`, `SKYBOX`, `MAP_*`, `LOTTIE`, `SPRITE`, `SUBTITLE`, and the leaf `GUI_*` types — is a leaf. The rule lives in `PARENT_CAPABLE_ENTITY_TYPES` in `cyango-shared` and is enforced on every write path: the scene tree refuses the drop, paste and create skip the parent, and the MCP bridge places the entity at the scene root instead.

To pair a leaf entity with labels, hotspots or colliders, put them in a `GROUP` as **siblings**.

Failure mode when you ignore this: the write reports success, `parentEntityId` comes back as `""`, and the entity sits at the scene root.

---

## Transforms & animation

Most "live" fields use `IAnimation<T>`: `currentValue` plus optional `keyframes`, `repeat`, `excludeFromMasterTimeline`.

| Field | Typical `T` |
|-------|-------------|
| `position` / `rotation` / `scale` | Number arrays (length 3). |
| `geometry` | `IEntityGeometry` (primitive + dimensions). |
| `material` | `IEntityMaterial` (`materialType` + Three.js-style props). |
| `media` | `IMediaClip` (video/audio clip on the timeline). |
| `gui` | `IEntityGUI` (per-breakpoint UI states). |
| `light` / `camera` / `player` / … | Type-specific structs — see family docs below. |
| `actions` | `IAction[]` — can be keyed like other tracks. |

---

## Visibility

`visibility` uses **`IVisibility`** — same shape as on scenes: optional booleans (and one language list) that hide this entity in specific contexts. If a flag is unset, it does not apply.

| Field | Role |
|-------|------|
| `hiddenTotally` | Hidden in all cases (strongest hide). |
| `hiddenInDesktop` | Hidden in desktop layout / viewport. |
| `hiddenInTablet` | Hidden on tablet breakpoint. |
| `hiddenInMobile` | Hidden on mobile breakpoint. |
| `hiddenInMobileAR` | Hidden in mobile AR. |
| `hiddenInVR` | Hidden in VR. |
| `hiddenInAR` | Hidden in AR. |
| `hideInTimeline` | Hidden on the timeline (editor / playback strip). |
| `hiddenInLanguages` | Hide only for these languages (`LanguageTypes[]`). |
| `hiddenInIPhone` | Hidden on iPhone. |
| `hiddenInIPad` | Hidden on iPad. |
| `hiddenInAndroid` | Hidden on Android devices. |
| `hiddenInPWAAndroid` | Hidden in Android PWA. |
| `hiddenInPWAiOS` | Hidden in iOS PWA. |

---

## Render order

`renderOrder` is an optional top-level number on `IEntity`. Use it only when visual draw order needs an explicit override, for example overlapping transparent planes, GUI-in-world panels, splats, or media surfaces.

| Field | Role |
|-------|------|
| `renderOrder` | Three.js draw-order override. Higher finite numbers draw later within the same opaque/transparent render pass. |

Important behavior:

- Unset means "use the renderer's per-entity default"; do not write `0` unless the user explicitly wants to override the default.
- Child entities inherit the nearest parent/group effective `renderOrder` unless the child sets its own finite value.
- This does not change timeline stacking, GUI flex layout, or transform depth. Do not use it as a replacement for position/scale/layout.
- In Studio, the editor control is in the Visibility section because it affects whether an entity visually appears above/below others.

Use `update_entities` with `propertyPath: "renderOrder"` to set or clear it.

---

## Other fields

| Field | Notes |
|-------|-------|
| `assetDomElementId` | Links DOM media to asset (composite id: `asset.id + entity.id`). |
| `tags` | `ITag[]` — `{ name, color, textColor? }` for filtering and action targeting. |
| `physics` | `IEntityPhysics` — Rapier rigid body: `enabled`, `type`, `shape`, mass, friction, colliders. |
| `layer` | `IAnimationLayer` — editor UI only (locked, duration, expanded). |
| `handles` | `IEntityHandles` — gizmo manipulation in editor. |
| `billboard` | Face-camera behavior. |
| `prefab` | `IEntityPrefabLink` — prefab id, overrides, instance group. |
| `animations` | `IAnimation<IEntityAnimation[]>` — clips for `CUSTOM_3D_MODEL`, `SPRITE`, and `LOTTIE`. Replaced wholesale on patch. |
| `spritesheet` | `IEntitySpritesheet` — `cols` / `rows` / `fps` grid for `SPRITE`. |
| `lottie` | `IEntityLottie` — `resolution` raster edge for `LOTTIE`. |
| `model3D` | `IEntityModel3D` — model-specific options on `CUSTOM_3D_MODEL`. |
| `uniformScale` | Keep scale uniform across axes. |
| `resizeToUnitBox` | Opt-in normalisation of the content to a 1-unit bounding box. Honoured by `CUSTOM_3D_MODEL` and the GUI-3D wrapper; other types ignore it. Unset keeps each renderer's existing behavior. |
| `teleport` | `IEntityTeleport` — teleport target behavior. |
| `mapProperties` | `IEntityMapProperties` — per-entity map placement (`MAP_*` scenes). |
| `player` | `IAnimation<IEntityPlayer>` — locomotion/player config on `PLAYER`. |
| `xrStore` | `IEntityXRStore` — XR store product metadata. |
| `tooltip` | Tooltip string. |

---

## Per-family docs

Each row names the file that defines that family's `entityType` values, roles, and payloads.

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
