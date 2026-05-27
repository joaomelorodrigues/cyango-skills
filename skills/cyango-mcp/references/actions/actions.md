# Actions (`IAction`)

## Writing actions via MCP

Use **`update_entities`** with `propertyPath: "actions.currentValue"` and `value` as an array of `IAction` objects — include it in the same **`update_entities`** batch as any other property changes for that entity when possible.

---

Actions drive navigation, visibility, media, property edits, modals, timelines, and more. They appear as `IAction[]` on:

- **Entities** — `actions.currentValue` (clicks and interactions).
- **Scenes** — `sceneActions` (lifecycle: enter/exit/ready).

Each object is one `IAction`. Combine `type` with the right companion fields (`targetSceneId`, `targetEntitiesIds`, `entityProperties`, …).

---

## `IAction` fields

| Field | Notes |
|-------|-------|
| `id` | Required. Unique string per action. |
| `name` | Optional label. |
| `type` | `ActionType` — required. |
| `disabled` | Skip execution when true. |
| `eventType` | `EventType` — when this action fires. |
| `isToggle` | Toggles between original values and `entityProperties`. |
| `targetSceneId` | For `GO_TO_SCENE`. |
| `toExternalUrl` | For `OPEN_URL`. |
| `lookAt` | Camera move / look-at (`CAMERA_LOOK_AT`). |
| `duration` / `ease` | Delay, tween timing (ms + GSAP ease name). |
| `sceneTransition` | `TransitionType` when changing scenes. |
| `modal` | Open/close modal payloads. |
| `customCode` | `{ code, errorMessages? }` — custom execution. Before writing or editing it, use the custom-code files listed from `SKILL.md`. |
| `conditions` | `IActionConditions` — all must pass. |
| `entityProperties` | Property paths → values. Used with `CHANGE_ENTITY_PROPERTY`. |
| `targetEntitiesIds` | Entities affected (show/hide, media, trigger). |
| `targetTags` | Same idea by tags instead of ids. |
| `prefabId` | `INSTANTIATE_PREFAB` — prefab from story list. |

---

## `ActionType`

**Scene / URL**

| Value | Needs |
|-------|-------|
| `GO_TO_SCENE` | `targetSceneId`; optional `sceneTransition`. |
| `NEXT_SCENE` / `PREVIOUS_SCENE` | Order follows story scene list. |
| `OPEN_URL` | `toExternalUrl`. |

**Entity visibility / trigger**

| Value | Needs |
|-------|-------|
| `SHOW_ENTITY` / `HIDE_ENTITY` | `targetEntitiesIds` (or tags). |
| `TRIGGER_ENTITY` | Runs target entity's actions. |
| `CHANGE_ENTITY_PROPERTY` | `entityProperties` + `targetEntitiesIds`. |
| `RESET_ENTITY_PROPERTIES` | `targetEntitiesIds`. |

### Modals

| Type | Description | Needs |
|------|-------------|--------|
| `OPEN_MODAL` | Open a modal overlay. | `modal` |
| `CLOSE_MODAL` | Close a modal. | `modal` |

### Media (entity clips)

| Type | Description | Needs |
|------|-------------|--------|
| `PLAY_ENTITY_MEDIA` | Play the target entity’s media. | `targetEntitiesIds` |
| `PAUSE_ENTITY_MEDIA` | Pause the target entity’s media. | `targetEntitiesIds` |
| `STOP_ENTITY_MEDIA` | Stop the target entity’s media. | `targetEntitiesIds` |
| `MUTE_ENTITY_MEDIA` | Mute the target entity’s media. | `targetEntitiesIds` |
| `UNMUTE_ENTITY_MEDIA` | Unmute the target entity’s media. | `targetEntitiesIds` |

### XR session

| Type | Description | Needs |
|------|-------------|--------|
| `ENTER_VR` | Enter VR mode. | — |
| `ENTER_AR` | Enter AR mode. | — |
| `ENTER_XR` | Enter VR or AR (whichever applies). | — |
| `EXIT_XR` | Exit VR or AR. | — |

### Camera

| Type | Description | Needs |
|------|-------------|--------|
| `CAMERA_LOOK_AT` | Move the camera and orient it toward a target. | `lookAt` |

### Map

| Type | Description | Needs |
|------|-------------|--------|
| `CENTER_GPS` | Request the user's current browser geolocation and center the active map on that latitude/longitude. | No extra fields. Usually `eventType: ON_CLICK` or another explicit trigger. |

Notes for `CENTER_GPS`:

- Do **not** add `targetEntitiesIds`, `entityProperties`, or `conditions.geolocation` unless the user asked for unrelated targeting/conditions. `CENTER_GPS` gets the user's location at execution time via `navigator.geolocation`.
- It depends on browser geolocation permission/support and on a mounted map recenter handler. Current runtime behavior uses the map recenter function registered by `Map2D`; if no recenter function is available, the action logs a warning and completes without moving the camera.
- On GPS timeout, runtime retries once using cached geolocation (`maximumAge: Infinity`) before giving up.

### Timeline

| Type | Description | Needs |
|------|-------------|--------|
| `PLAY_TIMELINE` | Play the timeline. | — |
| `PAUSE_TIMELINE` | Pause the timeline. | — |
| `STOP_TIMELINE` | Stop the timeline. | — |
| `MUTE_TIMELINE` | Mute the timeline audio. | — |
| `UNMUTE_TIMELINE` | Unmute the timeline audio. | — |

### Other `ActionType` values

| Type | Description | Needs |
|------|-------------|--------|
| `DELAY` | Wait for a duration before subsequent steps. | `duration` |
| `CUSTOM_CODE` | Run sandboxed story-player code with a `customCode` payload. Use the custom-code files listed from `SKILL.md`; do not infer syntax or `cyango.*` APIs from this table alone. | `customCode` |
| `OPEN_PRODUCT` | Open an XR store product. | — |
| `INSTANTIATE_PREFAB` | Instantiate a prefab; `entityProperties` can act as overrides. | `prefabId` |
| `NONE` | No operation. | — |

---

## `EventType`

Defined in `cyango-shared`. Pointer/UI rows follow standard hit-target semantics; scene/entity lifecycle rows use **React-style timing** where noted below.

### Pointer / UI

| Type | Description |
|------|-------------|
| `ON_CLICK` | Primary click or tap (press and release on the target). |
| `ON_DOUBLE_CLICK` | Second click within the platform double-click interval. |
| `ON_CONTEXT_MENU` | Context menu (e.g. right-click or long-press). |
| `ON_POINTER_ENTER` | Pointer entered the element’s hit region. |
| `ON_POINTER_OVER` | Pointer is over the element (often after enter). |
| `ON_POINTER_DOWN` | Pointer button pressed on the target. |
| `ON_POINTER_UP` | Pointer button released on the target. |
| `ON_POINTER_MOVE` | Pointer moved while interacting with the target. |
| `ON_POINTER_LEAVE` | Pointer left the element’s hit region. |
| `ON_CONTAINER_SCROLL` | A scrollable container’s scroll position changed. |
| `ON_WHEEL` | Mouse wheel or trackpad scroll on the target. |

### Scene lifecycle

**React-style timing:** `ON_SCENE_ENTER` ≈ pre-mount; `ON_SCENE_READY` ≈ post-mount; other rows extend that model.

| Type | Description |
|------|-------------|
| `ON_SCENE_ENTER` | The story has **entered** this scene, but the scene’s React tree is **not fully mounted yet** — use for work that must run as early as possible (before children finish mounting). |
| `ON_SCENE_READY` | The scene’s components are **mounted** and the scene is **ready** for interaction — use when you need DOM/Three/UIKit work to have run (similar to “after first paint” / post-commit). |
| `ON_SCENE_EXIT` | The story is **leaving** this scene — scene teardown is in progress (similar to **before unmount** / exit transition: last chance to read state before the scene unmounts). |
| `ON_SCENE_POSITIONED` | The scene’s **pose in world space is settled** (e.g. AR placement locked); analogous to **after layout / transform is committed**, not just “entered”. |
| `ON_SCENE_TIMELINE_START` | This scene’s **timeline playback started** — the scene is mounted and the timeline clock has begun (effect-style hook tied to playback, not navigation alone). |
| `ON_SCENE_TIMELINE_END` | This scene’s **timeline playback finished** — analogous to an effect completing its run for this scene’s timeline. |

### Entity lifecycle

Same idea at **entity** granularity: added vs ready mirrors “in the tree” vs “mounted and usable”; removed mirrors unmount.

| Type | Description |
|------|-------------|
| `ON_ENTITY_ADDED` | Entity is **in the scene graph** but may not be fully mounted yet (early hook — before relying on layout or child readiness). |
| `ON_ENTITY_READY` | Entity’s **view/layer is mounted** and the entity is **ready** (similar to a mounted component: safe to assume visuals and hit targets exist). |
| `ON_ENTITY_REMOVED` | Entity is **removed** from the scene (similar to **unmount** — cleanup / stop side effects). |

### App / language / XR

| Type | Description |
|------|-------------|
| `ON_LANGUAGE_CHANGED` | Active story language changed. |
| `ON_ENTER_VR` | User entered VR. |
| `ON_ENTER_AR` | User entered AR. |
| `ON_EXIT_XR` | User exited VR or AR. |

### Conditional (use with `conditions`)

| Type | Description |
|------|-------------|
| `ON_DATE_RANGE` | Fires when the current time falls within configured date ranges. |
| `ON_GEOLOCATION` | Fires when geolocation matches configured rules. |

### Other

| Type | Description |
|------|-------------|
| `NONE` | No specific event hook; timing follows the action `type` only. |

---

## `TransitionType`

Used with `GO_TO_SCENE` as `sceneTransition` (see `TransitionType` in `cyango-shared`).

| Type | Description |
|------|-------------|
| `NONE` | No animated transition — switch scenes immediately. |
| `FADE` | Cross-fade between outgoing and incoming scene. |
| `ZOOM_OUT_FADE_ZOOM_IN` | Outgoing scene zooms out and fades; incoming scene zooms in and fades (two-phase handoff). |
| `ZOOM_IN_FADE_ZOOM_OUT` | Zoom + fade with the opposite in/out choreography to `ZOOM_OUT_FADE_ZOOM_IN` (pick using editor preview). |
| `ZOOM_IN_FADE` | Zoom-in with fade into the next scene. |
| `ZOOM_OUT_FADE` | Zoom-out with fade away from the current scene. |

---

## `IActionConditions`

All clauses must match (AND semantics).

| Field | Role |
|-------|------|
| `activeLanguages` | Run only if current language is in the list. |
| `deviceTypes` | `iPhone`, `iPad`, `Android`, `MacOs`, `Windows`. |
| `xrModes` | `NONE`, `VR`, `AR`, `MOBILE_VR`, `MOBILE_AR`. |
| `dateRanges` | `{ start, end }` ISO strings. |
| `code` | Expression → boolean. |
| `geolocation` | User position vs configured area. |

---

## Common patterns

1. **Navigate** — `type: GO_TO_SCENE`, `targetSceneId`, optional `sceneTransition`, `eventType: ON_CLICK`.
2. **Toggle panels** — `SHOW_ENTITY` / `HIDE_ENTITY` on `targetEntitiesIds`, `eventType: ON_CLICK`.
3. **Property change** — `CHANGE_ENTITY_PROPERTY`, `targetEntitiesIds`, `entityProperties` as update paths, `eventType` as needed.
4. **Center map on user GPS** — `CENTER_GPS`, no extra payload, commonly `eventType: ON_CLICK` on a button/entity in a map scene.
