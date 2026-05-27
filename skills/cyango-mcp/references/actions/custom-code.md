# Custom Code

**This file covers:** which surface to use, MCP patch shapes, syntax rules, prefab bundling requirements, Story Head/Footer code, and verification steps.

Custom code is high-risk for MCP agents because the useful APIs are Cyango-specific runtime injections, not ordinary JavaScript. Do not guess method names or access patterns — use the runtime API reference for everything available in the sandbox.

## Choose the correct surface

Cyango has two different custom-code surfaces:

| Surface | Stored at | Runtime scope | MCP status |
|---------|-----------|---------------|------------|
| `CUSTOM_CODE` action | Entity `actions.currentValue` or scene `sceneActions` | Receives `cyango` (`storyState`, `uiState`, `timelineState`, `types`, `utils`) | Writable through current MCP tools |
| Story Head/Footer code | `settings.customHeadCode` / `settings.customFooterCode` | No `cyango`; sandbox utilities only | Inspectable with `get_story_state`; current MCP has no story-settings write tool |

Use `CUSTOM_CODE` actions for runtime interactions: click handlers, scene lifecycle hooks, timeline hooks, prefab spawning, state changes, and entity/scene updates during playback.

Use Head/Footer code for story-wide script-style setup such as analytics or third-party bootstrapping. Head/Footer snippets cannot access `cyango`.

Before editing or discussing Story Head/Footer code:

1. Read this file.
2. Do not use the `cyango` runtime API reference as available scope; Head/Footer has no `cyango`.
3. Check current MCP capabilities. If there is still no story-settings update tool, report that MCP can inspect but not patch Head/Footer code.

## Custom Code action patching

### Entity action patch

1. Fetch the existing entity first with `get_entity`; preserve unrelated actions.
2. Replace the full `actions.currentValue` array with `update_entities`.
3. Use `eventType` appropriate to the trigger (`ON_CLICK`, `ON_ENTITY_READY`, etc.).
4. Put JavaScript in `customCode.code` and keep `customCode.errorMessages` as an array.

```json
{
  "updates": [
    {
      "entityIds": ["button-entity-id"],
      "propertyPath": "actions.currentValue",
      "value": [
        {
          "id": "custom-code-open-url",
          "name": "Open docs from code",
          "type": "CUSTOM_CODE",
          "eventType": "ON_CLICK",
          "customCode": {
            "code": "await cyango.uiState.openUrl('https://example.com');",
            "errorMessages": []
          }
        }
      ]
    }
  ]
}
```

### Scene action patch

Use `update_scenes` with `propertyPath: "sceneActions"` and replace the full scene action array. Fetch the existing scene first and preserve unrelated scene actions.

```json
{
  "updates": [
    {
      "sceneIds": ["scene-id"],
      "propertyPath": "sceneActions",
      "value": [
        {
          "id": "custom-code-scene-ready",
          "name": "Scene ready code",
          "type": "CUSTOM_CODE",
          "eventType": "ON_SCENE_READY",
          "customCode": {
            "code": "console.log('Scene ready', cyango.storyState.activeSceneId);",
            "errorMessages": []
          }
        }
      ]
    }
  ]
}
```

## Language and runtime syntax

Custom Code action `code` is written as JavaScript executed inside an async function body:

- Top-level `await` works because the runtime wraps the snippet in an async IIFE.
- `return` is valid and exits the snippet.
- Write statements, not a module. Do not use static `import` / `export`.
- Do not use JSX or React component syntax.
- Prefer plain ES2020 JavaScript when possible.

Limited TypeScript syntax is supported for `CUSTOM_CODE` actions only:

- Runtime transpiles when it detects `: Type`, `interface`, or `type Foo`.
- Safe TS-only syntax: simple type annotations, interfaces, and type aliases.
- Do not rely on TS features that need module processing or imports. Runtime values must come from `cyango`, `console`, timers, literals, or values defined in the snippet.
- Head/Footer code does not go through the same Cyango custom action path; write Head/Footer snippets as runnable JavaScript.

The editor's Monaco field exposes type hints for `cyango`, but those are compile-time hints only. At runtime, `cyango` is injected for `CUSTOM_CODE` actions; it is not imported.

## Prefab bundling

If code calls `instantiatePrefab()`, make sure the prefab is bundled in the story:

- Prefabs referenced by normal `INSTANTIATE_PREFAB` actions are included automatically.
- Prefabs referenced only by custom code must be present in `settings.options.customCodePrefabIds` so `storyJson.prefabs` keeps a snapshot.
- Current MCP can instantiate an existing story prefab with `instantiate_prefab`, but it cannot currently edit `settings.options.customCodePrefabIds` because that is a story-settings patch.

## Story Head/Footer code

Storage shape:

```json
{
  "settings": {
    "customHeadCode": {
      "code": "console.log('head init');",
      "errorMessages": []
    },
    "customFooterCode": {
      "code": "console.log('footer init');",
      "errorMessages": []
    }
  }
}
```

Runtime behavior:

- `customHeadCode.code` runs when the story head component applies custom head code.
- `customFooterCode.code` runs when the story footer component applies custom footer code.
- These snippets are evaluated by the same sandbox helper but without the `cyango` namespace.
- Do not use `cyango.storyState`, `cyango.utils`, entity IDs, scene actions, prefab APIs, or custom action assumptions here.
- Direct browser globals are blocked. `console`, safe `setTimeout` / `setInterval`, and the code's own local variables are available.

Current MCP limitation:

- The enabled MCP tools expose `get_story_state`, `update_entities`, and `update_scenes`, but no story-level update command.
- Therefore an MCP agent can inspect existing Head/Footer code with `get_story_state`, but should not claim it has patched Head/Footer code through `update_scenes` or `update_entities`.
- If the MCP server later adds a story-settings patch tool, write these as full values at `settings.customHeadCode` and `settings.customFooterCode` with `{ "code": "...", "errorMessages": [] }`.

## Verification

After writing Custom Code actions:

1. Use `get_entity` or `get_scene` to verify the action array contains the new action and preserved existing actions.
2. Use `capture_screenshot` only for visible scene/GUI effects; custom-code errors are usually visible in the browser console, not the screenshot.
3. If the user asks to persist the story, call `save_story` only after explicit save permission.
