---
name: cyango-mcp
description: 'Cyango MCP: edit a live Cyango story through the batched MCP tools. Use for any Cyango MCP or bridge work, and for story-editing asks that never say "MCP": scenes, GUI and 3D layout, models and splats, lights, actions, timelines, custom code, prefabs, assets.'
---

**@cyango-tools/skills version:** `1.5.13`

# Cyango MCP Skill

Write tools are plural and batched: `add_entities`, `remove_entities`, `update_entities`, `add_scenes`, `remove_scenes`, `update_scenes`. `add_scene`, `remove_scene` and `update_scene` are one-scene wrappers over the same protocol. Single-write bridge commands (`addEntity`, `updateScene`, …) do not exist in protocol v6.

Utility tools: `bridge_status` (connection, queue depth, protocol version), `validate_patch` (check property paths offline, no editor round-trip), `instantiate_prefab`, `list_assets` / `insert_assets` / `upload_assets` / `remove_assets`, `list_asset_providers` / `search_provider_assets` for free stock assets, `get_story_state`.

Copy payload shapes from [payloads.md](references/payloads.md) rather than assembling them from field tables.

**Every field shape is in [cyango-shared-types.md](references/cyango-shared-types.md)**, generated from the types the editor itself runs on. Grep it by name (`interface IModal`, `enum ActionType`); it is 2000+ lines, so never read it whole.

## Three words this skill runs on

- **Wave**: every write of one kind for one change, sent in one call.
- **Slot**: the `<breakpoint>.<state>` address a GUI value lives in. Nothing renders from a bare path.
- **Leaf**: an entity type that takes no children. Parenting to a leaf reports success and drops the entity at the scene root.

## Hard rules

1. **One wave per operation type.** Every create in one `add_entities`, every patch in one `update_entities`, every removal in one `remove_entities`. Fragmented sequences destabilise the editor. See [batching-and-verification.md](rules/batching-and-verification.md).
2. **GUI values live in a slot**: `gui.currentValue.<breakpoint>.<state>.<prop>`. Fill `desktop.default` first. See [gui-desktop-first.md](rules/gui-desktop-first.md).
3. **Read [gui-properties.md](references/entities/gui/gui-properties.md) for every `GUI_*` in the change set**, including its [type defaults](references/entities/gui/gui-properties.md#type-defaults). Unset keys still render via component fallbacks, so the viewport never matches the JSON. Use only the values listed there. Stray CSS keywords (`none`, `inherit`) can crash Yoga/uikit.
4. **Read [non-gui-defaults.md](references/entities/non-gui-defaults.md) for every non-GUI type** in the change set before you assume what a created entity contains.
5. **Roots are world space, children are local to the parent.** See [hierarchy-and-coordinates.md](rules/hierarchy-and-coordinates.md).
6. **Reparent by patching `parentEntityId`** (`""` for scene root). The editor owns `children`.
7. **Most types are leaves.** Check [which types accept children](references/entities/common.md#which-types-accept-children) before you parent anything. Pair a leaf with its companions as siblings in a `GROUP`.
8. **Size primitives with `scale`.** `geometry` fields are export metadata and do not resize the viewport mesh.
9. **Size world-space GUI with GUI `width` / `height`**, and keep `scale` at `[1, 1, 1]`.
10. **Omit `scale` for unknown GLBs** in `insert_assets`. Passing `[1,1,1]` suppresses the editor's own normalisation.
11. **Icons are `GUI_ICON`** with a Lucide `iconSrc`, sized by `iconSize`, never a glyph in a `GUI_TEXT`. See [icons](rules/gui-design-best-practices.md#icons-use-gui_icon-never-a-glyph-in-gui_text).
12. **Let the editor infer entity type from an asset.** Pass `forceEntityType` only for the cases listed in [assets-common.md](references/assets/assets-common.md#image-and-video-entity-types--trust-the-editor-flat_-scope). `FLAT_IMAGE` / `FLAT_VIDEO` belong inside flat scenes only. For a poster or billboard in a 3D tour use `GUI_IMAGE`, a textured `PRIMITIVE_*`, or a model.
13. **`LOTTIE` renders through the GUI stack**, so it takes slots like `GUI_IMAGE` despite having no `GUI_` prefix.
14. **Custom code is the last resort.** Run the decision flow in [entity-choice.md](rules/entity-choice.md) first, then read [custom-code.md](references/custom-code.md) before you write any of the three surfaces.
15. **Scene switches gate entity features**: entity `physics` needs scene `physics.enabled`, light `castShadow` needs scene `shadowsEnabled`.
16. **Ground every field you write.** These pages cover behaviour, not every shape. When a field's shape is not spelled out here, get it in this order: grep [cyango-shared-types.md](references/cyango-shared-types.md) for the type name, then `get_entity` on something already using the feature, then `validate_patch` on the path. Ask the user when none of the three settles it.

Types that no longer exist: `HOTSPOT*`, `EMBED_*` entities and `LIVESTREAM_*` scenes. Older stories may still contain them; never create new ones.

### Entity roles

| Entity | Role | Create it? |
|--------|------|------------|
| `GUI_SCREEN` | Viewport anchor; screen-space GUI parents here | No, one per scene, created automatically |
| `GUI_CONTAINER` | Root and layout box of any GUI tree (`<div>`) | Yes, put `GUI_*` children in this, not in a `GROUP` |
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
| Which entity type or custom-code surface to use | [entity-choice.md](rules/entity-choice.md) → then [custom-code.md](references/custom-code.md) if code is needed |
| Custom JavaScript, story Head/Footer code | [custom-code.md](references/custom-code.md) |
| Importing files, placing existing assets | [assets-common.md](references/assets/assets-common.md) |
| Stock photos, videos, HDRIs or models the user does not have | [assets-common.md](references/assets/assets-common.md#provider-public-assets), `list_asset_providers` → `search_provider_assets` → `insert_assets` |
| A 3D model, a splat scan | [models-common.md](references/entities/models/models-common.md) |
| A Lottie or spritesheet animation | [animated-common.md](references/entities/animated/animated-common.md) |
| Cubes, spheres, planes and their materials | [primitives-common.md](references/entities/primitives/primitives-common.md) |
| Lighting, shadows | [lights-common.md](references/entities/lights/lights-common.md) |
| A 360° tour, panorama scenes | [small-families.md](references/entities/small-families.md#panorama--panorama-panorama_video-panorama_180-panorama_180_video) + [scenes.md](references/scenes/scenes.md) |
| Audio, 3D text, skybox/HDR, maps, subtitles, groups, camera/player | [small-families.md](references/entities/small-families.md) |
| Keyframes, timing, media clips | [timeline.md](references/timeline/timeline.md) |
| Overlapping or z-fighting surfaces, draw order | [common.md](references/entities/common.md#render-order) |
| A prefab placed in a scene | `instantiate_prefab`; prefab bundling notes in [custom-code.md](references/custom-code.md) |
| The core entity model, visibility flags, `IEntity` fields | [common.md](references/entities/common.md) |
| Something that "didn't work" or looks wrong | [batching-and-verification.md](rules/batching-and-verification.md#symptom--cause--fix) |
