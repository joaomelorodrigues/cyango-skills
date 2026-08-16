# Choosing entities and custom code

Pick the **simplest built-in type first**. Reach for custom code only when no entity or action covers the behavior, or when the built-in path would be brittle (many duplicated patches, per-frame logic, procedural geometry).

## Quick decision

```
Need something in the story?
│
├─ Story-wide script (analytics, third-party boot) with no cyango API?
│  └─ Story Head/Footer code: [custom-code.md](../references/custom-code.md#story-headfooter-code)
│
├─ Runs once on an event (click, scene ready, timeline hook)?
│  ├─ Matches a built-in ActionType? → that action: [actions.md](../references/actions/actions.md)
│  └─ Needs JS (state, prefab spawn, multi-step logic)? → CUSTOM_CODE action
│
├─ Visible content that persists in the scene?
│  ├─ Matches a built-in entity type? → that entity (see table below)
│  └─ Procedural mesh, per-frame animation, uikitml(), or tunable params in inspector?
│     └─ GUI_CUSTOM_CODE entity: [custom-code.md](../references/custom-code.md#custom-code-entities)
│
└─ Layout / grouping only, no render?
   └─ GROUP (or NONE for invisible logic anchor)
```

## Challenge → first choice

| The challenge | Use first | Not custom code when… |
|---------------|-----------|------------------------|
| Button, menu, HUD, form, modal chrome | `GUI_*` under `GUI_CONTAINER` / `GUI_SCREEN` | Layout, styling, and click → GUI + built-in actions |
| Icon control (close, play, menu) | `GUI_ICON` + container | A Lucide `iconSrc` covers it |
| Click → go to scene / show panel / open URL | `GO_TO_SCENE`, `SHOW_ENTITY`, `OPEN_URL`, … | One action covers it |
| Toggle visibility across GUI states | `SHOW_ENTITY` / `HIDE_ENTITY` on containers | No JS needed |
| Image, video, audio in scene | `FLAT_*`, `GUI_IMAGE`, `AUDIO_*`, asset drop | Editor infers type from asset |
| 360° / 180° tour | Panorama entities + matching scene type | |
| 3D model or splat | `insert_assets` → model / splat entity | |
| Simple shape or colored surface | `PRIMITIVE_*` + material | |
| Lottie or spritesheet loop | `LOTTIE` or `SPRITE` | Sized like GUI, through slots |
| Lighting / shadows / sky | `*_LIGHT`, `SKYBOX`, `HDR` | Scene flags gate physics/shadows |
| 3D label in world | `TEXT_3D` | |
| Camera move on click | `CAMERA_LOOK_AT` | |
| Map recenter on user GPS | `CENTER_GPS` | No target ids required |
| Timed sequence of show/hide / media | Timeline + entity actions | Prefer timeline over frame loops |
| Runtime counter, global state, branching | `CUSTOM_CODE` action + `cyango.utils.setGlobalVar` | |
| Spawn prefab from logic | `INSTANTIATE_PREFAB` action, or `CUSTOM_CODE` action if conditional | Whitelist prefab in `customCodePrefabIds` when code-only |
| Build mesh in code, spin every frame, instancing | `GUI_CUSTOM_CODE` entity | Actions must not build into `group` |
| Dynamic screen UI from markup string | `GUI_CUSTOM_CODE` entity under `GUI_SCREEN` + `uikitml()` | `uikitml()` throws in actions; markup is a strict HTML subset with no `<text>` tag — read [custom-code.md](../references/custom-code.md#uikitml-markup) first |
| Author-tunable knobs without opening code | `GUI_CUSTOM_CODE` entity `params` | Action params are MCP-only, not inspector-friendly |
| Multi-entity property patch at runtime | `CUSTOM_CODE` action → `cyango.storyState.updateStoryData` | Or several `CHANGE_ENTITY_PROPERTY` if static |

Once the flow lands on a custom-code surface, [custom-code.md](../references/custom-code.md) has the API, the sandbox, the lifetimes and the current MCP limits for all three.

## Built-in entity families (cheat sheet)

| Family | Types | Good for |
|--------|-------|----------|
| GUI | `GUI_CONTAINER`, `GUI_TEXT`, `GUI_IMAGE`, `GUI_BUTTON`, `GUI_ICON`, … | All screen and world UI |
| Structure | `GROUP`, `GROUP_BOX`, `NONE` | Parenting, invisible anchors |
| Primitives | `PRIMITIVE_BOX`, `PRIMITIVE_SPHERE`, … | Blocks, floors, simple props |
| Models | `CUSTOM_3D_MODEL`, `SPLAT` | GLB assets, gaussian splats |
| Animated | `LOTTIE`, `SPRITE` | Vector / sheet animation |
| Panorama | `PANORAMA`, `PANORAMA_VIDEO`, … | Immersive backgrounds |
| Media | `FLAT_IMAGE`, `FLAT_VIDEO`, `TEXT_3D_VIDEO` | Flat or 3D media surfaces |
| Audio | `AUDIO_GLOBAL`, `AUDIO_POSITIONAL` | Sound beds and 3D emitters |
| Environment | `SKYBOX`, `HDR` | Sky and IBL |
| Scene rig | `CAMERA`, `PLAYER`, `WEBCAM`, `FACE_MESH` | Viewport and XR rig |
| Lights | `DIRECTIONAL_LIGHT`, `POINT_LIGHT`, … | Illumination and shadows |

Deep defaults: [non-gui-defaults.md](../references/entities/non-gui-defaults.md), [gui-properties.md](../references/entities/gui/gui-properties.md).

## Red flags: wrong tool

| Symptom | Likely mistake | Fix |
|---------|----------------|-----|
| Meshes duplicated every click | `CUSTOM_CODE` action adding to `group` | Move build logic to `GUI_CUSTOM_CODE` entity |
| Transform snaps back every frame | Entity code setting `group.position` / rotation / scale | Animate a child mesh; let inspector own transform |
| Full UI built in action | Used `uikitml()` in action | `GUI_CUSTOM_CODE` entity under GUI parent |
| `uikitml()` renders nothing, anywhere | Markup rejected as a whole: a `<text>` tag, two roots, a camelCase or CSS-only property, or a `padding: 12px 20px` shorthand | Read the thrown error in the console; see [uikitml markup](../references/custom-code.md#uikitml-markup) |
| 50 GUI patches for one dynamic list | Patching entities from code repeatedly | `GUI_CUSTOM_CODE` entity or one container + show/hide |
| Analytics in entity code | Head/Footer task | `settings.customHeadCode` / `customFooterCode` |
| `add_entities` rejects `GUI_CUSTOM_CODE` | MCP server lacks the type enum | User adds via **Add Entities → Advanced → Custom Code**, then patch `customCode` with `update_entities` |

A built-in type that MCP can create in one wave beats a surface the user has to add by hand.
