# Canonical payloads

Copy these shapes. Every example is a complete, valid tool call — replace ids and values, do not restructure. Field meanings live in the per-topic references; this file only fixes the shape.

The two mistakes these examples exist to prevent: writing a bare property path where a breakpoint/state slot is required, and splitting one logical change across many calls.

---

## `add_entities` — 3D entities with hierarchy

Parents must come before their children. Reference an in-batch parent by `parentIndex` (0-based, index within this call); use `parentEntityId` only for an entity that already exists.

```json
{
  "sceneId": "scene_a1b2",
  "entities": [
    {
      "entityType": "GROUP",
      "name": "Kiosk",
      "position": [2, 0, -4]
    },
    {
      "entityType": "PRIMITIVE_CUBE",
      "name": "Base",
      "parentIndex": 0,
      "position": [0, 0.5, 0],
      "scale": [1.2, 1, 1.2],
      "overrides": {
        "material": { "currentValue": { "color": "#2E5AAC", "materialType": "STANDARD" } }
      }
    },
    {
      "entityType": "POINT_LIGHT",
      "name": "Key",
      "parentIndex": 0,
      "position": [0, 2.2, 0],
      "overrides": {
        "light": { "currentValue": { "intensity": 8, "distance": 6 } }
      }
    }
  ]
}
```

Notes that trip up every first attempt:

- `position` / `rotation` / `scale` are plain arrays at the top level of the row, but **inside `overrides` every animated block is wrapped** in `{ "currentValue": … }`.
- Child transforms are local to the parent; root transforms are world. See [hierarchy-and-coordinates.md](../rules/hierarchy-and-coordinates.md).
- `scale` sizes a primitive; `geometry` fields do not.

---

## `add_entities` — a screen-space GUI tree

One call builds the whole tree. `GUI_SCREEN` already exists in the scene, so it is referenced by id, not created.

```json
{
  "sceneId": "scene_a1b2",
  "entities": [
    {
      "entityType": "GUI_CONTAINER",
      "name": "Card",
      "parentEntityId": "entity_screen_id",
      "overrides": {
        "gui": {
          "currentValue": {
            "desktop": {
              "default": {
                "width": 800,
                "height": "auto",
                "padding": 32,
                "gap": 16,
                "flexDirection": "column",
                "overflow": "visible",
                "backgroundColor": "#101317",
                "backgroundOpacity": 0.92,
                "borderRadius": 16
              }
            }
          }
        }
      }
    },
    {
      "entityType": "GUI_TEXT",
      "name": "Title",
      "parentIndex": 0,
      "overrides": {
        "gui": {
          "currentValue": {
            "desktop": {
              "default": {
                "text": { "en-US": "Welcome" },
                "fontSize": 28,
                "lineHeight": "36px",
                "textColor": "#FFFFFF",
                "width": "100%",
                "whiteSpace": "normal"
              }
            }
          }
        }
      }
    }
  ]
}
```

- The localization key is `"en-US"` with a hyphen. `"en_US"` silently creates a dead key.
- Every GUI value sits under `<breakpoint>.<state>` — `desktop.default` here. Writing `width` directly under `currentValue` does nothing.
- Only author `desktop` unless the user asked for responsive behaviour ([gui-desktop-first.md](../rules/gui-desktop-first.md)).

---

## `update_entities` — one call, several kinds of change

Each row targets its own `entityIds` + `propertyPath` + `value`. Batch every patch of a working session into as few calls as possible.

```json
{
  "updates": [
    {
      "entityIds": ["entity_cube_1"],
      "propertyPath": "position.currentValue",
      "value": [0, 1.5, -3]
    },
    {
      "entityIds": ["entity_cube_1", "entity_cube_2"],
      "propertyPath": "material.currentValue.color",
      "value": "#C81E4A"
    },
    {
      "entityIds": ["entity_card"],
      "propertyPath": "gui.currentValue.desktop.hover.backgroundColor",
      "value": "#1B2029"
    },
    {
      "entityIds": ["entity_label"],
      "propertyPath": "gui.currentValue.desktop.default.text",
      "value": { "en-US": "Continue" }
    },
    {
      "entityIds": ["entity_cube_2"],
      "propertyPath": "parentEntityId",
      "value": ""
    }
  ]
}
```

- Reparent by patching `parentEntityId`: `""` moves an entity to the scene root, an entity id nests it. Never patch `children`.
- Transform paths end in `.currentValue`; GUI paths continue into `<breakpoint>.<state>.<prop>`.
- Run [`validate_patch`](#validate_patch) on unfamiliar paths before sending.

---

## `add_scenes`

```json
{
  "scenes": [
    { "sceneType": "TOUR_3D", "name": "Lobby" },
    { "sceneType": "PANORAMA_360", "name": "Rooftop", "index": 0 }
  ]
}
```

`index` inserts at a 0-based position; omit it to append. What each scene type seeds is in [scenes.md](scenes/scenes.md#what-mcp-seeds-per-scene-type).

---

## `update_scenes`

```json
{
  "updates": [
    {
      "sceneIds": ["scene_a1b2"],
      "propertyPath": "title.en-US",
      "value": "Lobby"
    },
    {
      "sceneIds": ["scene_a1b2", "scene_c3d4"],
      "propertyPath": "physics.enabled",
      "value": true
    },
    {
      "sceneIds": ["scene_a1b2"],
      "propertyPath": "shadowsEnabled",
      "value": true
    }
  ]
}
```

---

## `insert_assets`

Places existing story or library assets. One call can span several scenes: rows carry their own `sceneId`, the top-level one is the fallback.

```json
{
  "sceneId": "scene_a1b2",
  "inserts": [
    { "assetId": "asset_pano_1", "forceEntityType": "PANORAMA" },
    {
      "assetId": "asset_model_1",
      "position": [0, 0, -2],
      "assetFolderId": "folder_9f"
    },
    {
      "assetId": "asset_logo_1",
      "sceneId": "scene_c3d4",
      "parentEntityId": "entity_screen_id"
    }
  ]
}
```

- Omit `scale` for unknown GLBs — passing `[1,1,1]` suppresses the editor's own normalisation ([models-common.md](entities/models/models-common.md#scale-arbitrary-authored-units--models-may-appear-invisible-or-giant)).
- Omit `forceEntityType` unless a row in [assets-common.md](assets/assets-common.md#image-and-video-entity-types--trust-the-editor-flat_-scope) calls for it.
- Library assets need `assetFolderId` (plus `page` / `perPage`) when they are not on the currently loaded page.

---

## Provider assets — search then insert

```json
// 1. search_provider_assets
{ "provider": "polyhaven", "query": "forest", "assetCategory": "HDR", "perPage": 12 }

// 2. insert_assets — the id comes straight from the search result
{
  "sceneId": "scene_a1b2",
  "inserts": [{ "assetId": "<id from the search result>" }]
}
```

Call `list_asset_providers` first for the provider names and the categories each one supports. Items with `needsImport: true` (every 3D model) are copied server-side on insert, which can take minutes. Report the item's `attribution.author` and `license` to the user — see [assets-common.md](assets/assets-common.md#provider-public-assets).

---

## `upload_assets`

```json
{
  "items": [
    { "source": "path", "value": "/Users/me/renders/lobby.jpg" },
    { "source": "url", "value": "https://example.com/logo.svg", "name": "logo.svg" },
    {
      "source": "directory",
      "value": "/Users/me/props",
      "recursive": true,
      "fileTypes": ["glb"],
      "maxFiles": 20
    }
  ]
}
```

Add `insert` to an item only when every asset it produces should land at the same transform; otherwise upload first and follow with one `insert_assets`. Accepted extensions are listed in [assets-common.md](assets/assets-common.md#import-workflow).

---

## Actions

Actions live in the `actions` track and are replaced as a whole array, so read the current value first when appending to an entity that already has some.

```json
{
  "updates": [
    {
      "entityIds": ["entity_close_button"],
      "propertyPath": "actions.currentValue",
      "value": [
        {
          "id": "action_1",
          "type": "HIDE_ENTITY",
          "eventType": "ON_CLICK",
          "targetEntitiesIds": ["entity_modal"]
        }
      ]
    }
  ]
}
```

The entities an action affects go in `targetEntitiesIds` (not `entityIds` — that is the `update_entities` field, one level up). Full `ActionType` / `EventType` lists and the companion field each type expects are in [actions.md](actions/actions.md).

---

## `validate_patch`

Cheap, offline, no editor round-trip. Use it whenever a path is not one you have already used in this session.

```json
{
  "patches": [
    { "propertyPath": "gui.currentValue.desktop.default.width", "value": 800 },
    { "propertyPath": "parentEntityId", "value": "" }
  ]
}
```
