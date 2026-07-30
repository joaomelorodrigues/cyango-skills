# Scenes

A story is an ordered list of scenes. Each scene has `entities[]`, optional `timeline`, and optional `sceneActions` (scene-level; separate from per-entity `actions`).

---

## Scene types

| Scene type | Notes |
|------------|-------|
| `TOUR_3D` | First- or third-person movement in 3D with colliders. Default scene for interactive experiences including 2D-style GUI overlays. |
| `MODEL_VIEWER` | Camera orbits around a 3D model target. |
| `PANORAMA_360` | Fixed camera; 360° panorama (image or video). |
| `PANORAMA_180_SCENE` | Fixed camera; 180° panorama. |
| `FLAT_SCENE` | Fixed camera, no orbit controls — flat media layer in front of the camera. |
| `MAP_2D_SCENE` / `MAP_3D_SCENE` | Map scenes. `MAP_2D_SCENE` gets a top-down camera at `[0, 1000000, 0]`; `MAP_3D_SCENE` is not offered in the Studio dialog yet. |
| `WEBCAM_SCENE` | Live webcam feed. |

Livestream scene types (`LIVESTREAM_PANORAMA`, `LIVESTREAM_180_VIDEO_SCENE`) were removed from `SceneTypes`; do not use them.

Use these strings for `sceneType`; compare with `get_story_state` / `get_scene` if rejected.

### What MCP seeds per scene type

`add_scene(s)` mirrors Studio's `createSceneData`: every scene gets a `GUI_SCREEN` ("Screen") and a `CAMERA`, plus

| Scene type | Extra entities |
|------------|----------------|
| `TOUR_3D` | `SKYBOX`, `AMBIENT_LIGHT` at `[10, 10, 10]` |
| `MODEL_VIEWER` | `AMBIENT_LIGHT`, `HDR`, `sceneColor: "#f5f5f5"` |
| `FLAT_SCENE` | `AMBIENT_LIGHT`; camera controls disabled |
| `PANORAMA_360` / `PANORAMA_180_SCENE` | none — add the panorama entity via `insert_assets` |
| `MAP_2D_SCENE` / `MAP_3D_SCENE` | `SKYBOX` + `MAP_2D` / `MAP_3D` |
| `WEBCAM_SCENE` | `WEBCAM`; camera controls disabled |

> **HDR caveat**: in Studio, `MODEL_VIEWER` also gets a default Poly Haven HDR **asset** bound to the `HDR` entity. The bridge's `addScenes` command carries scenes only, so an MCP-created scene has the `HDR` entity with no source. Bind an HDR asset with `insert_assets` (or tell the user to pick one) when the lighting matters.

---

## Scene object fields

| Field | Role |
|-------|------|
| `id` | Scene id (navigation, `GO_TO_SCENE`, deep links). |
| `name` | Display name. |
| `sceneType` | One of the types above. |
| `entities` | Entities in this scene; hierarchy via parent ids. |
| `timeline` | Optional scene-level `ITimeline`. |
| `visibility` | Optional — `IVisibility` (per-device/language/timeline hiding). |
| `sceneActions` | Lifecycle `IAction[]` (e.g. `ON_SCENE_ENTER`). |
| `sceneColor` | Background color. |
| `physics` | `enabled`, `gravity`, `debug`. |
| `tags` | Tags for filtering / actions. |
| `effects` | Post-processing stack (bloom, DOF, color grading, anti-aliasing). |
| `toneMapping` | Renderer tone mapping. |
| `title` | Localized title (`{ "en-US": "Lobby" }`) — what Studio shows when `name` is unset. |
| `thumbnailAsset` | Scene thumbnail; `insert_assets` sets it automatically when a panorama lands in a panorama scene. |
| `hasCustomDuration` | The timeline duration was typed by the user instead of derived from content. |
| `hideSystemTheme` | Hide the system theme UI in this scene. |
| `shadowsEnabled` | Turn the canvas shadow map on for this scene. Required before any light's `castShadow` produces visible shadows. |
| `forcedQualityLevel` | `StoryQualityLevel` — pins quality while this scene is active, overriding the viewer's choice. |

### `StoryQualityLevel`

Numeric enum, not a string: `LOW = 0`, `MEDIUM = 1`, `HIGH = 2`, `ULTRA = 3`. Patch it as a number:

```json
{ "sceneIds": ["scene_x"], "propertyPath": "forcedQualityLevel", "value": 2 }
```

Leave it unset unless the user explicitly wants to force quality — it overrides their own quality selection on every device.

---

## GUI and 2D-style experiences

For 2D-style content (quizzes, menus, overlays), use `TOUR_3D` and parent GUI under the scene's `GUI_SCREEN`.

---

## MCP scene tools

Scene write tools use the MCP server's plural-only write protocol internally:

| Task | Tool |
|------|------|
| Add one scene | `add_scene` |
| Add multiple scenes | `add_scenes` |
| Update one scene | `update_scene` |
| Update multiple scenes/properties | `update_scenes` |
| Remove one scene | `remove_scene` |
| Remove multiple scenes | `remove_scenes` |
| Read one scene | `get_scene` |
| Read scene list | `list_scenes` |

Prefer `update_scenes` when several scene patches can be bundled into one call. Each update item targets `sceneIds`, `propertyPath`, and `value`.

Before scene update patches that touch GUI-like values or uncertain paths, call `validate_patch` with the intended `propertyPath`/`value` pairs. For bridge/connection issues, call `bridge_status` instead of repeatedly re-reading story state.
