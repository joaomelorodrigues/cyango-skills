---
name: cyango-mcp
description: 'Cyango MCP: live editor via plural/batched tools. Use for scenes, GROUPs, GUI, 3D layout, Lottie/sprite animation, splats, lights and shadows, actions, custom code actions, story Head/Footer code, timelines, prefabs, navigation, bridge status/debugging, patch validation — or any Cyango MCP/bridge work. Infer from the ask even without "MCP". Batch writes, screen vs world GUI, breakpoints, schema-safe GUI values. UI design requests assume responsive layout (tablet/mobile overrides after desktop).'
---

**@cyango-tools/skills version:** `1.4.1`

# Cyango MCP Skill

Write tools are plural and batched: `add_entities`, `remove_entities`, `update_entities`, `add_scenes`, `remove_scenes`, `update_scenes`. `add_scene`, `remove_scene` and `update_scene` are one-scene wrappers over the same protocol. Single-write bridge commands (`addEntity`, `updateScene`, …) do not exist in protocol v6.

Utility tools: `bridge_status` (connection, queue depth, protocol version), `validate_patch` (check property paths offline, no editor round-trip), `instantiate_prefab`, `list_assets` / `insert_assets` / `upload_assets` / `remove_assets`, `list_asset_providers` / `search_provider_assets` for free stock assets, `get_story_state`.

Copy payload shapes from [payloads.md](references/payloads.md) rather than assembling them from field tables.

## Hard rules

1. **Batch.** Every entity create for a change goes in one `add_entities`, every patch in one `update_entities`, and so on — one call per operation type, never one per entity. Fragmented sequences destabilise the editor — [batching-and-verification.md](rules/batching-and-verification.md).
2. **GUI values live at `gui.currentValue.<breakpoint>.<state>.<prop>`.** A bare path under `currentValue` writes nothing. Author `desktop.default` first; for **UI design** requests (menus, dashboards, forms, etc.) assume responsive and add `tablet`/`mobile` overrides after desktop is solid. For other GUI edits, `desktop` alone unless the user asks for breakpoints — [gui-desktop-first.md](rules/gui-desktop-first.md).
3. **Read [gui-properties.md](references/entities/gui/gui-properties.md) for every `GUI_*` in the change set**, including its [type defaults](references/entities/gui/gui-properties.md#type-defaults). Unset keys still render via component fallbacks, so the viewport never matches the JSON. Use only values listed there — stray CSS keywords (`none`, `inherit`) can crash Yoga/uikit.
4. **Read [non-gui-defaults.md](references/entities/non-gui-defaults.md) for every non-GUI type** in the change set before assuming what a created entity contains.
5. **Roots are world space, children are local to the parent** — [hierarchy-and-coordinates.md](rules/hierarchy-and-coordinates.md).
6. **Reparent by patching `parentEntityId`** (`""` for scene root). Never patch `children`.
7. **Only some types accept children.** `GROUP`, `GROUP_BOX`, `PRIMITIVE_*`, `GUI_CONTAINER`, `GUI_SCREEN`, `FLAT_IMAGE`, `FLAT_VIDEO`, `TEXT_3D`, `TEXT_3D_VIDEO`, `CAMERA`, `PLAYER`, `WEBCAM`, `FACE_MESH` — and nothing else. `SPLAT` never takes children; pair it with companions as siblings in a `GROUP`. Parenting to a leaf lands the entity at the scene root — [common.md](references/entities/common.md#which-types-accept-children).
8. **Size primitives with `scale`.** `geometry` fields are export metadata and do not resize the viewport mesh.
9. **Size world-space GUI with GUI `width` / `height`**, keeping `scale` at `[1, 1, 1]`. Never micro-scale a transform to fake pixel units.
10. **Omit `scale` for unknown GLBs** in `insert_assets`; passing `[1,1,1]` suppresses the editor's own normalisation.
11. **Icons are `GUI_ICON`** with a Lucide `iconSrc` (`"X"`, `"ChevronLeft"`, `"Play"`), sized by `iconSize`. Never a glyph character in a `GUI_TEXT`.
12. **Let the editor infer entity type from an asset.** Pass `forceEntityType` only for the cases listed in [assets-common.md](references/assets/assets-common.md#image-and-video-entity-types--trust-the-editor-flat_-scope). `FLAT_IMAGE` / `FLAT_VIDEO` belong inside flat scenes only — for a poster or billboard in a 3D tour use `GUI_IMAGE`, a textured `PRIMITIVE_*`, or a model.
13. **`LOTTIE` renders through the GUI stack**, so it is sized and placed like `GUI_IMAGE` (via `gui.currentValue`) even though it has no `GUI_` prefix.
14. **Scene switches gate entity features**: entity `physics` needs scene `physics.enabled`, light `castShadow` needs scene `shadowsEnabled`.
15. **Reuse matching scenes and entities** instead of creating near-duplicates.

Types that no longer exist: `HOTSPOT*`, `EMBED_*` entities and `LIVESTREAM_*` scenes. Older stories may still contain them; never create new ones.

### Entity roles

| Entity | Role | Create it? |
|--------|------|------------|
| `GUI_SCREEN` | Viewport anchor; screen-space GUI parents here | No — one per scene, created automatically |
| `GUI_CONTAINER` | Root and layout box of any GUI tree (`<div>`) | Yes — put `GUI_*` children in this, not in a `GROUP` |
| `GROUP` | Frame for non-GUI or mixed 3D + GUI composites | Yes |

## What to read for the task at hand

| The user asks for… | Read |
|--------------------|------|
| Any write at all | [payloads.md](references/payloads.md) for the shape, [batching-and-verification.md](rules/batching-and-verification.md) for the order |
| A button, menu, panel, HUD, overlay, modal | [gui-design-best-practices.md](rules/gui-design-best-practices.md#recipes) → [gui-properties.md](references/entities/gui/gui-properties.md) |
| An icon, close/back/play control | [gui-design-best-practices.md](rules/gui-design-best-practices.md#icons-use-gui_icon-never-a-glyph-in-gui_text) |
| Responsive / mobile / tablet layout | [gui-desktop-first.md](rules/gui-desktop-first.md) |
| A new scene, scene settings, navigation between scenes | [scenes.md](references/scenes/scenes.md) |
| Click behavior, show/hide, go-to-scene, media control, GPS | [actions.md](references/actions/actions.md) |
| Custom JavaScript, story Head/Footer code | [custom-code.md](references/custom-code.md) |
| Importing files, placing existing assets | [assets-common.md](references/assets/assets-common.md) |
| Stock photos, videos, HDRIs or models the user does not have | [assets-common.md](references/assets/assets-common.md#provider-public-assets) — `list_asset_providers` → `search_provider_assets` → `insert_assets` |
| A 3D model, a splat scan | [models-common.md](references/entities/models/models-common.md) |
| A Lottie or spritesheet animation | [animated-common.md](references/entities/animated/animated-common.md) |
| Cubes, spheres, planes and their materials | [primitives-common.md](references/entities/primitives/primitives-common.md) |
| Lighting, shadows | [lights-common.md](references/entities/lights/lights-common.md) |
| A 360° tour, panorama scenes | [small-families.md](references/entities/small-families.md#panorama--panorama-panorama_video-panorama_180-panorama_180_video) + [scenes.md](references/scenes/scenes.md) |
| Audio, 3D text, skybox/HDR, maps, subtitles, groups, camera/player | [small-families.md](references/entities/small-families.md) |
| Keyframes, timing, media clips | [timeline.md](references/timeline/timeline.md) |
| Overlapping or z-fighting surfaces, draw order | [common.md](references/entities/common.md#render-order) |
| A prefab placed in a scene | `instantiate_prefab`; prefab bundling notes in [custom-code.md](references/custom-code.md) |
| Something that "didn't work" or looks wrong | [batching-and-verification.md](rules/batching-and-verification.md#symptom--cause--fix) |

## File index

Paths are relative to this skill folder (`cyango-mcp/`).

### Rules (how to work)

| File | Covers |
|------|--------|
| [batching-and-verification.md](rules/batching-and-verification.md) | Call batching, write order, verification after writes, symptom → cause → fix table. |
| [hierarchy-and-coordinates.md](rules/hierarchy-and-coordinates.md) | World vs local transforms, `parentIndex`, composing entity trees. |
| [gui-desktop-first.md](rules/gui-desktop-first.md) | Breakpoint cascade, `gui.currentValue` path format, when to touch tablet/mobile. |
| [gui-design-best-practices.md](rules/gui-design-best-practices.md) | Recipes, icons, sizing for 1920 × 1080, screen vs world GUI, parent-chain troubleshooting. |

### References (what the data is)

| File | Covers |
|------|--------|
| [payloads.md](references/payloads.md) | Complete example payload for every write tool. |
| [entities/common.md](references/entities/common.md) | `IEntity` core fields, visibility, render order, family index. |
| [entities/non-gui-defaults.md](references/entities/non-gui-defaults.md) | Creation defaults and minimum-to-set for every non-GUI type. |
| [entities/gui/gui-common.md](references/entities/gui/gui-common.md) | `IEntityGUI`, breakpoints and states, uikit role mapping. |
| [entities/gui/gui-properties.md](references/entities/gui/gui-properties.md) | Every GUI field, allowed values, per-type defaults. |
| [entities/primitives/primitives-common.md](references/entities/primitives/primitives-common.md) | `PRIMITIVE_*` geometry and material fields. |
| [entities/lights/lights-common.md](references/entities/lights/lights-common.md) | `*_LIGHT` fields, shadow block, per-type applicability. |
| [entities/models/models-common.md](references/entities/models/models-common.md) | `CUSTOM_3D_MODEL` and `SPLAT`, clips, splat source and effects, GLB scale handling. |
| [entities/animated/animated-common.md](references/entities/animated/animated-common.md) | `LOTTIE` and `SPRITE` — raster config, spritesheet grid, clip playback. |
| [entities/small-families.md](references/entities/small-families.md) | Structure, panorama, 3D text, audio, environment, camera/player/webcam/face, maps, subtitle. |
| [scenes/scenes.md](references/scenes/scenes.md) | `SceneTypes`, scene fields, what each scene type seeds. |
| [actions/actions.md](references/actions/actions.md) | `IAction`, `ActionType`, `EventType`, conditions, patch shape. |
| [timeline/timeline.md](references/timeline/timeline.md) | `ITimeline`, `IAnimation`, keyframes, `IMediaClip`, animation clips. |
| [assets/assets-common.md](references/assets/assets-common.md) | Asset tools, upload rules, asset → entity mapping, splat formats. |
| [custom-code.md](references/custom-code.md) | `CUSTOM_CODE` actions vs story Head/Footer code, runtime scope, limitations. |
