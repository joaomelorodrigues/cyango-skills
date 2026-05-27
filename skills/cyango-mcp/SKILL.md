---
name: cyango-mcp
description: 'Cyango MCP: live editor via plural/batched tools. Use for scenes, GROUPs, GUI, 3D layout, actions, custom code actions, story Head/Footer code, timelines, prefabs, navigation, bridge status/debugging, patch validation — or any Cyango MCP/bridge work. Infer from the ask even without "MCP". Batch writes, screen vs world GUI, breakpoints, schema-safe GUI values.'
---

**@cyango-tools/skills version:** `1.0.12`

# Cyango MCP Skill

Use batch tools only. Entity writes go through `add_entities`, `remove_entities`, and `update_entities`; scene writes go through `add_scenes`, `remove_scenes`, and `update_scenes` when more than one scene is involved. `add_scene`, `remove_scene`, and `update_scene` are one-scene convenience wrappers that still use the batched MCP protocol internally.

Helpful utility tools:

- `bridge_status` — check editor connection, queue depth, pending commands, and protocol version before/after debugging bridge issues.
- `validate_patch` — validate `propertyPath` and common GUI value mistakes before sending `update_entities`, `update_scene`, or `update_scenes`.
- `instantiate_prefab` — instantiate an existing Studio prefab into a scene.

Current MCP server write protocol is plural-only (v4): `addScenes`, `removeScenes`, `updateScenes`, `addEntities`, `removeEntities`, `updateEntities`. Do not rely on old single-write bridge commands such as `addEntity`, `removeEntity`, `addScene`, `removeScene`, `updateScene`, or `updateEntity`.

## Non-obvious rules

- **Primitives — scale, not geometry**: Studio canvas builds primitives from fixed Three.js args; `geometry.currentValue` fields (`radius`, `width`, etc.) are JSON/export metadata and do **not** resize the viewport mesh. Use `scale` to size. Read [primitives-common.md](references/entities/primitives/primitives-common.md) before assuming geometry fields affect what you see.
- **World vs local**: roots = world space; children = **local** to parent — [hierarchy-and-coordinates.md](rules/hierarchy-and-coordinates.md).
- **Entity roles**:

  | Entity | Role | Add manually? |
  |--------|------|---------------|
  | `GUI_SCREEN` | Viewport anchor; screen GUI parents here. Auto-created. | **No** |
  | `GUI_CONTAINER` | GUI tree root (`<div>`). All `GUI_*` inside this, not in `GROUP`. | Yes |
  | `GROUP` | Non-GUI / mixed 3D+GUI composites. | Yes |

- **Desktop-first**: finish `desktop` first; `tablet`/`mobile` only when the user wants responsive. Breakpoints are override slots; runtime cascades per-property mobile→tablet→desktop. Tablet writes affect mobile inheritance — [gui-desktop-first.md](rules/gui-desktop-first.md).
- **Batch writes (critical)**: use the fewest possible calls — batch by operation type (`add_entities` for entity creates, `remove_entities` for entity removals, `update_entities` for entity patches; `add_scenes`, `remove_scenes`, `update_scenes` for multi-scene work). Fragmented sequences cause editor instability — [batching-and-verification.md](rules/batching-and-verification.md).
- **Actions — `CENTER_GPS`**: map action that requests browser geolocation at runtime and recenters the active map; it needs no target entity or payload beyond `type`/`eventType`. Read [actions.md](references/actions/actions.md#map) before adding it.
- **Custom code is mandatory-read territory**: before working in any way, shape, or form with custom code, read [custom-code.md](references/actions/custom-code.md), then read [custom-code-runtime-api.md](references/actions/custom-code-runtime-api.md) before using any `cyango.*` definition. `CUSTOM_CODE` actions go on entity/scene action arrays and receive the runtime `cyango` namespace; story Head/Footer code lives under story settings and does **not** receive `cyango`. Do not guess Cyango-specific runtime APIs from general JavaScript knowledge.
- **Physics prerequisite**: if any entity in the change set has a `physics` block, ensure the scene has `physics.enabled: true` (and gravity set intentionally) via `update_scene` or `update_scenes` before validating. Entity-level physics does not simulate when scene physics is off.
- **Render order**: use optional top-level `renderOrder` for draw-order fixes, not transform `z` or timeline `layer`. It is a finite number, higher values draw later within the same opaque/transparent pass, and children inherit a parent's effective render order unless they set their own. In Studio the control lives in the Visibility section; read [common.md](references/entities/common.md#render-order) before writing it.
- **GUI — read [gui-properties.md](references/entities/gui/gui-properties.md) for every `GUI_*` in the change set**: check **[type defaults](references/entities/gui/gui-properties.md#type-defaults)** and field tables for every property you set or assume. MCP deep-merges `gui.currentValue`; unset keys still render via `GUI2D_*` JSX fallbacks — invisible in JSON/`get_entity`. Viewport ≠ JSON.
  - "Button" = `GUI_CONTAINER` + `GUI_TEXT`; default `overflow: scroll` → spurious scrollbars unless `visible`; default container **150×150** → surprise width if you only set height.
  - World-space GUI scale stays identity: use `scale.currentValue: [1, 1, 1]`; size panels/buttons with GUI `width`/`height`, not tiny transform scales like `[0.004, 0.004, 0.004]`.
- **Non-GUI types — read [non-gui-defaults.md](references/entities/non-gui-defaults.md) for every non-GUI entity in the change set**: check per-type creation defaults and the minimum-to-set table. MCP deep-merges creation defaults; unset keys are not written to story JSON and not visible in `get_entity`.
- **Schema-safe values**: only use values listed in [gui-properties.md](references/entities/gui/gui-properties.md) for GUI fields. Stray CSS keywords (`none`, `inherit`, …) can crash Yoga/uikit.
- Reuse matching scenes/entities when possible.

## Skill files (canonical index)

Every path is relative to this skill folder (`cyango-mcp/`).

### Rules (operational)

| File | Read when… |
|------|------------|
| [batching-and-verification.md](rules/batching-and-verification.md) | **Always read before any write** (create/remove/update). Follow batching/order rules and verify/debug guidance. |
| [hierarchy-and-coordinates.md](rules/hierarchy-and-coordinates.md) | **Read before placing, nesting, or composing entities.** Use its transform/local-space and `add_entities` `parentIndex` rules. |
| [gui-desktop-first.md](rules/gui-desktop-first.md) | **Read before any GUI write.** Use its `gui.currentValue` path format, create JSON shape, and breakpoint cascade rules. |
| [gui-design-best-practices.md](rules/gui-design-best-practices.md) | **Read for GUI layout decisions and GUI debugging.** Apply `GUI_SCREEN` vs world-space, sizing, and parent-chain troubleshooting rules. |

### Cross-cutting topics

| File | Contents |
|------|----------|
| [references/entities/common.md](references/entities/common.md) | **Open when touching any entity model data.** Source of truth for `IEntity` core fields, visibility, and family index. |
| [references/scenes/scenes.md](references/scenes/scenes.md) | **Open before scene create/edit/navigation work.** Source of truth for `sceneType` and scene fields. |
| [references/actions/actions.md](references/actions/actions.md) | **Open before adding/editing actions.** Source of truth for `IAction`, `ActionType`, `EventType`, conditions, and MCP patch shape. |
| [references/actions/custom-code.md](references/actions/custom-code.md) | **Mandatory before working in any way, shape, or form with custom code.** Covers `CUSTOM_CODE` actions vs story Head/Footer code, runtime scope, MCP patch shapes, sandbox rules, prefab bundling, and current MCP limitations. |
| [references/actions/custom-code-runtime-api.md](references/actions/custom-code-runtime-api.md) | **Mandatory before using or modifying custom code that touches `cyango.*`.** Full reference for `cyango.storyState`, `cyango.uiState`, `cyango.timelineState`, `cyango.types`, `cyango.utils`, shared Monaco types, and runtime-vs-type-only caveats. |
| [references/timeline/timeline.md](references/timeline/timeline.md) | **Open before timeline/media/keyframe work.** Source of truth for `ITimeline`, `IAnimation`, keyframes, and `IMediaClip`. |

### Entity families (`references/entities/`)

| File | Read when… |
|------|------------|
| [references/entities/non-gui-defaults.md](references/entities/non-gui-defaults.md) | **Open for any non-GUI create/update.** Creation defaults for all non-GUI types: primitives, lights, media, camera, skybox, HDR, webcam, text-3D, audio. Minimum-to-set table. |
| [references/entities/gui/gui-common.md](references/entities/gui/gui-common.md) | **Read first for any `GUI_*` task.** Defines `IEntityGUI`, breakpoints, and UIKit role mapping. |
| [references/entities/gui/gui-properties.md](references/entities/gui/gui-properties.md) | **Mandatory for every GUI create/update/debug pass.** Validate every GUI field/value and check **[type defaults](references/entities/gui/gui-properties.md#type-defaults)** for each `GUI_*` type in scope. |
| [references/entities/primitives/primitives-common.md](references/entities/primitives/primitives-common.md) | **Open before any `PRIMITIVE_*` create/edit.** Use its geometry/material field rules. |
| [references/entities/lights/lights-common.md](references/entities/lights/lights-common.md) | **Open before any light create/edit.** Use as `*_LIGHT` source of truth. |
| [references/entities/panorama/panorama-common.md](references/entities/panorama/panorama-common.md) | **Open before panorama work.** Source of truth for panorama entity fields. |
| [references/entities/text-3d/text-3d-common.md](references/entities/text-3d/text-3d-common.md) | **Open before `TEXT_3D*` work.** Source of truth for text-3D fields. |
| [references/entities/maps/maps-common.md](references/entities/maps/maps-common.md) | **Open before `MAP_*` work.** Source of truth for map entity fields. |
| [references/entities/models/models-common.md](references/entities/models/models-common.md) | **Open before model/splat work.** Source of truth for model and splat fields. |
| [references/entities/environment/environment-common.md](references/entities/environment/environment-common.md) | **Open before `SKYBOX`/`HDR` work.** Source of truth for environment fields. |
| [references/entities/audio/audio-common.md](references/entities/audio/audio-common.md) | **Open before `AUDIO_*` work.** Source of truth for audio entity fields. |
| [references/entities/camera-player/camera-player-common.md](references/entities/camera-player/camera-player-common.md) | **Open before camera/player/webcam/face work.** Source of truth for those entity fields. |
| [references/entities/subtitle/subtitle-common.md](references/entities/subtitle/subtitle-common.md) | **Open before subtitle work.** Source of truth for `SUBTITLE` fields. |
| [references/entities/structure/structure-common.md](references/entities/structure/structure-common.md) | **Open before `GROUP`/`GROUP_BOX`/`NONE` structural work.** Source of truth for structure entities. |
