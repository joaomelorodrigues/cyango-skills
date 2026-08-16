# Custom Code

Cyango has three custom-code surfaces. They share one block shape, `ICustomCode`
(`code`, `compiledCode`, `errorMessages`, `params`), one editor and one save-time compile. What
differs is the host: when the block runs and what it receives.

**Not sure which surface or whether to use a built-in entity instead?** Start with [entity-choice.md](../rules/entity-choice.md).

| Surface | Stored at | Runs | Runtime scope | MCP status |
|---------|-----------|------|---------------|------------|
| `CUSTOM_CODE` action | Entity `actions.currentValue` or scene `sceneActions` | Once, when its event fires | The shared scope | Writable through current MCP tools |
| `GUI_CUSTOM_CODE` entity | Entity `customCode` | On mount, then every frame, then disposed | The shared scope | Blocked until the MCP server ships a cyango-shared with `EntityTypes.GUI_CUSTOM_CODE` |
| Story Head/Footer code | `settings.customHeadCode` / `settings.customFooterCode` | On story load | `console` and timers only, no `cyango` | Inspectable with `get_story_state`; current MCP has no story-settings write tool |

`compiledCode` is written by the editor when the story is saved, and the player runs it in
preference to `code`. Never author `compiledCode` by hand; write `code` and let the save produce it.

## Custom Code actions

Use `CUSTOM_CODE` actions for runtime interactions: click handlers, scene lifecycle hooks, timeline hooks, prefab spawning, state changes, and entity/scene updates during playback.

### Entity action patch

1. Fetch the existing entity first with `get_entity`; preserve unrelated actions.
2. Replace the full `actions.currentValue` array with `update_entities`.
3. Use `eventType` appropriate to the trigger (`ON_CLICK`, `ON_ENTITY_READY`, etc.).

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
            "code": "cyango.uiState.openUrl('https://example.com');",
            "errorMessages": []
          }
        }
      ]
    }
  ]
}
```

### Scene action patch

Use `update_scenes` with `propertyPath: "sceneActions"` and replace the full scene action array.

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

### Language and runtime syntax

Custom Code action `code` is written as **JavaScript executed inside an async function body**:

- Top-level `await` works because the runtime wraps the snippet in an async IIFE.
- `return` is valid and exits the snippet.
- Write statements, not a module. Do not use static `import` / `export`.
- Do not use JSX or React component syntax.
- Prefer plain ES2020 JavaScript when possible.

TypeScript is supported on every surface, including Head/Footer code:

- The editor compiles **every** block to JavaScript when the story is saved, into `compiledCode`.
  There is no runtime detection heuristic and no TypeScript compiler in the player.
- Safe TS-only syntax: type annotations, interfaces, and type aliases.
- Do not rely on TS features that need module processing or imports. Runtime values must come from
  the scope, literals, or values you define in the block.
- MCP patches land in the editor's store, where a block has `code` but no `compiledCode` yet. The
  compile runs on save, so TypeScript written through MCP is fine: it is compiled before the story
  can ever be published. Never write `compiledCode` yourself.
- A block that fails to compile is saved with its source as `compiledCode`, so a syntax error ships
  and fails at run time rather than blocking the save. Keep MCP-written blocks simple enough to be
  obviously valid.

The editor's Monaco field exposes type hints for `cyango`, but those are compile-time hints only. At runtime, `cyango` is an injected object for `CUSTOM_CODE` actions; it is not imported.

### The shared scope

Every block gets the same names, whichever host runs it. What differs is lifetime, not API.

| Name | What it is | Caveat |
|------|------------|--------|
| `THREE` | The app's three.js instance | Never import three; a second copy breaks `instanceof` |
| `group` | The entity's own `Object3D` | For an action, resolved from the entity it is attached to. `undefined` before the canvas mounts |
| `entity` | The `IEntity` the block belongs to | `null` for a scene action |
| `params` | Values from `customCode.params`, keyed by name | Authored on entities; an action's must be written directly |
| `scene`, `camera`, `renderer` | The live three.js objects | `undefined` before the canvas mounts |
| `loaders` | `gltf` (DRACO, KTX2 and meshopt attached), `texture`, `rgbe` | `undefined` before the canvas mounts |
| `uikitml(html)` | Builds a uikit interface from markup | **Throws in an action.** It needs an entity's lifetime to be driven and disposed |
| `cyango` | The platform API, below | Always present |
| `console`, timers | Namespaced logging, tracked timers | Delays are capped at 60000 ms |

Only a `GUI_CUSTOM_CODE` entity can usefully `return { update, dispose }`. An action's return value is
discarded, and nothing disposes what an action leaves in `group`, so **an action must not build into
`group`**. Building geometry belongs in an entity.

The `cyango` namespace holds:

- `cyango.storyState`: `activeStoryJson`, `activeSceneId`, `activeLanguage`, `setActiveScene`, `triggerAction`, `updateStoryData`, `instantiatePrefab`, XR helpers, asset helpers.
- `cyango.uiState`: loading/camera/breakpoint state, `openUrl`, system modal helpers.
- `cyango.timelineState`: timeline mode, elapsed time, mute state, media controls.
- `cyango.types`: enums such as `ActionType`, `EventType`, `EntityTypes`, `SceneTypes`, `PlayingModes`.
- `cyango.utils`: `getEntityById`, `getEntityByName`, `getActiveScene`, `thisEntity`, `globalVars`, `setGlobalVar`, `getGlobalVar`, `getAssetUrl`, GUI scroll helpers, `instantiatePrefab`, `detectDeviceType`, `detectBrowser`, `getWindowLocation`, `getNavigator`.
  `getAssetUrl(assetId?)` resolves a story asset to a URL, quality level included; with no argument
  it returns the asset assigned to `thisEntity`.

### Sandbox globals and blocked browser APIs

Available globals:

- `cyango` on every surface except Head/Footer code.
- `console.log`, `console.warn`, `console.error`, `console.info`; output is prefixed `[code> ...]`,
  with the entity name for an entity block and `custom-code` for an action.
- `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval`; delays are capped at 60000 ms.
- Locals, functions, classes, arrays, objects, promises, and normal JavaScript built-ins.

Shadowed/blocked globals:

- `window`
- `document`
- `sessionStorage`
- `location`
- `navigator`
- `history`
- `XMLHttpRequest`
- `WebSocket`
- `eval`
- `Function`
- `globalThis`
- `self`

Use the exposed helpers instead of blocked globals:

- Use `cyango.utils.getNavigator()` instead of `navigator`.
- Use `cyango.utils.getWindowLocation()` instead of `location`.
- There is no direct `document` replacement; if the task needs DOM manipulation, explain that this sandbox is not intended for direct DOM access.

Current runtime does not shadow `fetch` or `localStorage`, but do not rely on them unless the user explicitly needs that behavior; prefer Cyango state/actions/helpers for story interactions.

### Common snippets

Set a persistent runtime variable:

```js
const count = (cyango.utils.getGlobalVar('count') ?? 0) + 1;
cyango.utils.setGlobalVar('count', count);
console.log('count', count);
```

Change scene:

```js
cyango.storyState.setActiveScene('target-scene-id');
```

Patch story data at runtime:

```js
cyango.storyState.updateStoryData([
  {
    type: 'entities',
    entityIds: ['entity-id'],
    propertyPath: 'visible.currentValue',
    value: false
  }
]);
```

Instantiate a prefab from code:

```js
cyango.utils.instantiatePrefab({
  prefabId: 'prefab-id',
  sceneId: cyango.storyState.activeSceneId
});
```

If code calls `instantiatePrefab()`, make sure the prefab is bundled in the story:

- Prefabs referenced by normal `INSTANTIATE_PREFAB` actions are included automatically.
- Prefabs referenced only by custom code must be present in `settings.options.customCodePrefabIds` so `storyJson.prefabs` keeps a snapshot.
- Current MCP can instantiate an existing story prefab with `instantiate_prefab`, but it cannot currently edit `settings.options.customCodePrefabIds` because that is a story-settings patch.

## Params

`params` is a list on the block. Each entry carries its own value **and** its own inspector control,
so a story can tune a block without opening the code.

**Authored on entities.** The `GUI_CUSTOM_CODE` entity inspector shows a control per param, and its
editor has a Params block for defining them. The action editor has neither, because an action is
listed in the inspector rather than expanded, so its params would have nowhere to be tuned from.

The action *runtime* still receives `params`, because the scope is shared. So an action's params are
reachable only by writing them yourself, which an MCP patch can do: set `customCode.params` on the
action and the code reads them as `params.<key>`. Useful when the same action is duplicated across
entities and only a value differs. Do not expect the user to find or edit them in the editor.

On a `GUI_CUSTOM_CODE` entity:

```json
{
  "customCode": {
    "code": "console.log(params.speed);",
    "params": [
      { "key": "colour", "value": "#6366f1", "label": "Colour" },
      { "key": "speed", "value": 1, "type": "SLIDER", "label": "Speed", "min": 0, "max": 5, "step": 0.1 }
    ]
  }
}
```

- Only `key` is required. Omit `type` and the inspector infers a control from the value: number to
  a number field, boolean to a switch, `#rrggbb` string to a colour picker, other string to a text
  field, `[x, y, z]` to three number fields.
- Set `type` for what a value cannot imply: `NUMBER`, `SLIDER`, `BOOLEAN`, `TEXT`, `COLOR`,
  `SELECT`, `VECTOR3`. Refine with `label`, `help`, `min`, `max`, `step` and `options`.
- `SLIDER` needs both `min` and `max`, or it renders as a plain number field.
- The code reads them flattened by key: `params.speed`, never `params[1].value`.
- Values whose type has no control (nested objects, mixed arrays) still reach the code, but the
  inspector lists them as JSON-only rather than rendering a control.

Changing any param re-runs the entity block that reads it.

## Custom Code entities

A `GUI_CUSTOM_CODE` entity is an entity built from code rather than the inspector. It keeps the
transform, visibility, timeline, parenting and prefab behaviour of any other entity; only its
content comes from the block.

Its code is at `customCode` on the entity, not inside `actions`.

```json
{
  "entityType": "GUI_CUSTOM_CODE",
  "name": "Instanced field",
  "customCode": {
    "code": "const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());\ngroup.add(mesh);\nreturn { update: (delta) => { mesh.rotation.y += delta; } };",
    "params": [{ "key": "count", "value": 200 }]
  }
}
```

### The block contract

- The block runs on mount, inside an async function, so top-level `await` works.
- It may return `{ update, dispose }`. Both are optional.
- `update(delta, elapsed)` runs every frame. `dispose()` runs before a re-run and on teardown.
- Anything left in `group` is removed and disposed automatically, including geometries, materials
  and textures. Tracked timers are cleared too. Write `dispose` only for what was created outside
  the group.

### Rules for entity blocks

1. **Never set `group.position`, `group.rotation` or `group.scale`.** The inspector and the timeline
   own the entity transform and overwrite it every frame. Animate a child object instead.
2. **Never import Three.js.** It is in scope as `THREE`. A second copy breaks `instanceof` across
   the scene.
3. **Never call `renderer.render()`.** The story already draws the frame.
4. **Do not build a scene, camera, controls, tone mapping or an environment.** Those are the
   Camera entity, the scene camera controls, the scene settings and the HDR entity. A block that
   recreates them fights the story.
5. **Load assets through `cyango.utils.getAssetUrl()` and `loaders`,** not by hardcoding URLs. With
   no argument it returns the asset assigned to this entity; pass an asset id for any other.
6. **Screen space is a parenting decision.** To put an interface on screen, set the entity's
   `parentEntityId` to the scene's `GUI_SCREEN`. Do not build a second fullscreen root. Under a GUI
   parent the entity is a uikit container, so `uikitml()` output is laid out by the GUI, while plain
   meshes are not laid out and belong in world space.
7. **`uikitml(html)` output is attached, driven and disposed for you.** Do not add it to `group` or
   call `update` on it.

### What only an entity can do

The scope is shared with actions, so what is listed in [the shared scope](#the-shared-scope) is all
available here. Three things are entity-only in practice:

- **`return { update, dispose }`** is read. An action's return value is discarded.
- **`group` is safe to build into**, because the entity disposes what is left in it. An action must
  not, since nothing would ever clean it up.
- **`uikitml()` works.** It throws in an action.

Under a GUI parent the entity's `group` is a uikit `Container` rather than a `Group`, so `uikitml()`
output is laid out by the GUI while plain meshes are not laid out and belong in world space.

### uikitml markup

uikitml is a small subset of HTML, not HTML. It reports problems as diagnostics instead of throwing,
so **one bad tag or one bad property skips the whole interface**. Nothing renders, in screen space or
in world space. The player turns those diagnostics into a thrown error naming the entity, so read the
browser console before changing anything else.

**Tags.** Exactly these, and nothing else:

`div`, `p`, `span`, `li`, `h1`–`h6`, `ol`, `ul`, `a`, `button`, `img`, `svg`, `video`, `input`, `textarea`

There is **no `<text>` tag**. Text is written directly inside a container, and `span` is the usual
carrier. `img`, `svg`, `video`, `input` and `textarea` take no children.

**One root.** The markup must have exactly one top-level element. Two siblings fail with
`multiple-roots`; wrap them in a `div`.

**Properties are kebab-case uikit props, not CSS.** The name is the uikit property spelled with
dashes, so `background-color`, `flex-direction`, `border-radius`, `font-size`. `backgroundColor` is
rejected. Names that exist in CSS but not in uikit are rejected too, so there is no `box-shadow`, and
`position` is `position-type` with `position-top` / `position-left` for the offsets.

**No multi-value shorthands.** `padding: 12px 20px` and `margin: 4px 8px` are both invalid. Use one
value (`padding: 12px`), the axis form (`padding-x`, `padding-y`), or the sides
(`padding-top`, `padding-left`, ...).

**`id` does not reach the object.** uikitml keeps `id` in the markup but never sets three's
`Object3D.name`, so `getObjectByName()` will not find it, and no attribute sets that name. Reach a
child by position instead, and remember pointer events bubble, so listening on the root also fires
for everything inside it:

```js
const root = await uikitml(`
  <div style="padding: 16px; background-color: #111827; border-radius: 12px">
    <button style="padding-x: 20px; padding-y: 12px; background-color: #6366f1; border-radius: 8px">
      <span style="color: white">Next scene</span>
    </button>
  </div>
`);

// Markup order is child order.
root.children[0].addEventListener('click', () => cyango.storyState.setNextScene());
```

**Style inline, not with classes.** A `<style>` block parses and a `class` attribute is accepted, but
`uikitml()` never applies them: uikit resolves classes against a global stylesheet that nothing
populates, so the element renders unstyled and only a `class "x" not present in the global
stylesheet` warning appears. Put every property in the element's own `style`.

**Clicks pass through a bare panel.** Under a `GUI_SCREEN` the entity's own container follows the
same rule as `GUI_CONTAINER`: it catches the pointer only when it shows chrome or is interactive,
and otherwise lets the click reach the scene behind. Its background defaults to transparent, so a
`GUI_CUSTOM_CODE` HUD does not block the 3D underneath by default, and the elements your markup
builds keep their own pointer events either way. To force it, set `pointerEvents` on the entity's
GUI data (`auto` to always catch, `none` to never), not in the markup. See
[Who catches the click](entities/gui/gui-properties.md#who-catches-the-click).

## Story Head/Footer code

Use Head/Footer code for story-wide script-style setup such as analytics or third-party bootstrapping.

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
- These snippets are evaluated by the same sandbox helper but **without** the `cyango` namespace. Do not use `cyango.storyState`, `cyango.utils`, entity IDs, scene actions, or prefab APIs here.
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

