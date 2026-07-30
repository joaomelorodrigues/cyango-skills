# Batching, writes, and verification

Many separate create/remove/update operations can **crash the editor connection**. **Always** use batch tools:

- **Entity writes**: `add_entities`, `remove_entities`, `update_entities`, `insert_assets`.
- **Scene writes**: `add_scenes`, `remove_scenes`, `update_scenes` for multi-scene work; `add_scene`, `remove_scene`, `update_scene` are one-scene convenience wrappers that still use batched bridge commands internally.

The current MCP server bridge protocol is plural-only for writes (v6). Do not depend on old single-write bridge commands like `addEntity`, `removeEntity`, `addScene`, `removeScene`, `updateScene`, or `updateEntity`.

## Entity writes (required)

- **Creates**: always **`add_entities`** for new entities and **`insert_assets`** for asset-backed entities — order parents before children; use `parentIndex` when the parent row is in the same batch.
- **Removals**: always **`remove_entities`** — pass every target `entityId` in one call when they belong to the same scene.
- **Scenes**: use **`add_scene`** for one scene, **`add_scenes`** for multiple scenes in the same planned scene batch, **`remove_scenes`** for multi-scene removals, and **`update_scenes`** for scene patches across more than one scene.
- **Entity property updates**: always **`update_entities`** — bundle every patch for the task into one call’s `updates` array (each patch can target different `entityIds`). Prefer setting layout and payloads via `overrides` on **`add_entities`** at create time so you need fewer follow-up updates.
- **Reparenting existing entities**: use **`update_entities`** with `propertyPath: "parentEntityId"` (`value: ""` for root or target parent id string). Keep all reparent patches for the task in one batch call.
- **Asset insertions**: use one **`insert_assets`** call for the full insertion wave. Rows may set `sceneId` each; optional top-level `sceneId` fills in rows that omit it. The MCP server forwards **one bridge `insertAssets` command per distinct scene** — still batch at the tool level, not as many separate MCP calls. Do not split one wave into many tiny calls.
- **Scene property updates**: use **`update_scene`** for one scene, or **`update_scenes`** when different scene IDs/properties can be patched together.

## Verification (debugging only)

`get_entity` and `list_entities` are **not** required after every write. Use them when you suspect a value did not apply, an entity is missing, or you are debugging layout. The MCP **`add_entities`** / **`remove_entities`** / **`insert_assets`** tools already re-check existence against the editor and report `verified` / `fallbackUsed` in the response — agent-level re-verification after every batch duplicates that and adds latency.

`{"success": true}` from the bridge still only means the editor accepted the command; if something looks wrong in the viewport, that is when to read state.

Use **`bridge_status`** when debugging connection/queue problems, and **`validate_patch`** before writes when you are unsure about GUI paths or schema-safe values.

## Symptom → cause → fix

Start here when a write "worked" but the result is wrong. Most of these fail silently: the tool returns success and the viewport disagrees.

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| GUI patch applied, nothing changed | Path missing the breakpoint/state slot (`gui.currentValue.width` instead of `gui.currentValue.desktop.default.width`) | Re-patch with the full path; run `validate_patch` first |
| GUI entity exists but is invisible or clipped | Parent `GUI_CONTAINER` is still the 150 × 150 default with `overflow: "scroll"` | Set the parent's `width` / `height` and `overflow: "visible"` — [parent chain table](gui-design-best-practices.md#layout-troubleshooting-parent-chain) |
| Button renders as a text link | No explicit `height`; the container collapsed to padding + line height | Set `height` (60–80 px at 1080p) |
| `width: "100%"` resolves to the wrong size | No numeric-width ancestor in the chain | Give the nearest card/panel a numeric width, or parent under `GUI_SCREEN` |
| Text clipped or not wrapping | `lineHeight` below the glyph height, or missing `whiteSpace: "normal"` / `width` | Set `lineHeight` ≥ `fontSize` + ~4 px, `whiteSpace: "normal"`, explicit `width` |
| Localized text never appears | Key written as `"en_US"` | Use `"en-US"` (hyphen) |
| Icon renders as a right arrow | `iconSrc` is not a valid Lucide name — invalid values fall back to `ArrowRight` | Correct the name — [icon list](gui-design-best-practices.md#icons-use-gui_icon-never-a-glyph-in-gui_text) |
| Primitive did not change size | Resized via `geometry` fields, which are export metadata | Set `scale` |
| Model invisible or fills the whole scene | GLB authored in non-standard units | Read `scale.currentValue`, apply a corrective scale — [models-common.md](../references/entities/models/models-common.md#scale-arbitrary-authored-units--models-may-appear-invisible-or-giant) |
| World-space GUI is tiny or unreadable | Transform micro-scaled (e.g. `[0.004, 0.004, 0.004]`) to fake pixel units | Reset `scale` to `[1, 1, 1]`; size with GUI `width` / `height` |
| Lottie or sprite shows nothing | No asset bound, or `animations` was replaced with a partial array | Bind the asset; send the complete clip array — [animated-common.md](../references/entities/animated/animated-common.md) |
| Lights look right, no shadows | Scene `shadowsEnabled` is off | `update_scene` → `shadowsEnabled: true` |
| Physics bodies do not move | Scene `physics.enabled` is off | `update_scene` → `physics.enabled: true` |
| Children render in the wrong order | Sibling sequence is layout order; re-added entities append to the end | Re-add the affected siblings in the intended order |
| Entity landed at the scene root instead of under its parent | The requested parent is a type that cannot hold children (`SPLAT`, lights, models, panoramas, audio, HDR…) | Parent under a `GROUP` and make them siblings — [which types accept children](../references/entities/common.md#which-types-accept-children) |
| Panorama came in as `GUI_IMAGE` | The scene already had a panorama, so inference fell through | Insert with `forceEntityType: "PANORAMA"` |
| Asset upload rejected | Extension outside the accepted list | Check [assets-common.md](../references/assets/assets-common.md#import-workflow); convert first |
| `remove_assets` reports `blocked` | The asset is used by a story, prefab, or bundle | Report the named scenes/stories to the user; do not retry |
| Editor disconnected mid-batch | Batch too large or the editor crashed while rendering | Reconnect, check `bridge_status`, retry in smaller batches |
| Overlapping transparent surfaces flicker | Draw order, not position | Set `renderOrder` — [common.md](../references/entities/common.md#render-order) |

### Reference: what to check when debugging a suspected silent failure

Use the tables below only when you are investigating — not as a mandatory checklist after every operation.

**All entities:**

| Check | What to verify in `get_entity` |
|-------|-------------------------------|
| Name | `name` matches what you set. |
| Hierarchy | `parentEntityId` is correct (or empty for roots). |
| Transform | `position.currentValue`, `rotation.currentValue`, `scale.currentValue` match intended values. |
| Visibility | `visibility.hiddenTotally` and per-device flags match intent. |
| Actions | `actions.currentValue` array has correct length, ids, types, and nested objects (targets, properties, eventTypes). |

**Primitives / 3D content:**

| Check | What to verify |
|-------|---------------|
| Geometry | `geometry.currentValue.primitive` matches type (e.g. `BOX` for cube). Dimensions (`radius`, `width`, `height`) are what you set. |
| Material | `material.currentValue.color`, `materialType`, `metalness`, `roughness` match intent. |

**Lights:**

| Check | What to verify |
|-------|---------------|
| Light props | `light.currentValue.intensity`, `lightColor`, `distance`, `decay` match intent. |

**GUI entities:**

| Check | What to verify | Fix if wrong |
|-------|---------------|-------------|
| Text wrapping | `GUI_TEXT` inside a flex parent has `width` (e.g. `"100%"`) and `whiteSpace: "normal"` | Set `gui.currentValue.desktop.default.width` and `.whiteSpace` |
| Line clipping | `lineHeight` ≥ `fontSize` + ~4 px | Increase `lineHeight` |
| Container sizing | Parent `GUI_CONTAINER` has explicit `width`/`height` when children use `%` values | Set numeric or `"auto"` sizing on the container |
| Overflow | Wrapper `overflow` is `"visible"` unless scrolling is intended | Set `overflow: "visible"` |
| Responsive | `tablet` and `mobile` breakpoints have values if the design needs them — each is an independent override slot; writing to `desktop` does not auto-populate others | Set per-breakpoint values explicitly |

**Media / audio:**

| Check | What to verify |
|-------|---------------|
| Clip | `media.currentValue.volume`, `loop`, `play`, `speed` match intent. |
| Positional audio | `audio3D.currentValue.distance`, `rolloffFactor` match intent. |

If a value did not stick, re-apply with a **single** **`update_entities`** call whose `updates` array contains the fix.

Do not patch `children` paths directly; hierarchy should flow through `parentEntityId`.

## GUI on create

Pass `gui` (and other fields) in **`overrides` on each row of `add_entities`**. The MCP server deep-merges `overrides.gui.currentValue` with per-type defaults. Get layout right at create time to avoid extra **`update_entities`** churn.

## Child ordering in `add_entities`

Children render in the order they appear in the parent's children list. In flex layouts this is the visual order — a `flexDirection: "column"` panel with children added as `[Label, Question, Answers]` renders top-to-bottom in that sequence; add them as `[Answers, Label, Question]` and the buttons appear above the question text. The same principle extends to paint order, z-stacking, and any other context where sibling sequence is meaningful. Parents must always precede their children within a batch.

**Re-adding a removed entity appends it to the end.** If `[A, B, C]` exists and you remove then re-add `B`, the result is `[A, C, B]`. To restore correct order, remove all out-of-sequence siblings and re-add them in the right sequence.

## Read before removing or re-adding entities

Before removing any entity for any reason (ordering fix, reparenting, style correction), call `get_entity` on the **parent** to capture the full property set of all children. When re-creating the entity, every property from the original — including `height`, `positionType`, `justifyContent`, and any other GUI field — must be explicitly restated in the new **`overrides`** for **`add_entities`**. The MCP does not carry over any data from a removed entity. Properties omitted from the re-creation are silently dropped and revert to type defaults, which may be visually wrong (e.g. a button without explicit `height` collapses to `padding + lineHeight`, looking like a text link).

## Read before large edits

Use `get_story_state`, `get_scene`, or `get_entity` before bulk changes **when scene IDs, entity IDs, or structure are not already in your context** — so you do not edit the wrong targets.
