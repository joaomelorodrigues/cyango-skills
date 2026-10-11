# Batching, writes, and verification

A **wave** is every write of one kind for one change, sent in one call. Many separate create/remove/update calls can **crash the editor connection**, so each change is a small set of waves, never a stream of single writes.

- **Entity writes**: `add_entities`, `remove_entities`, `update_entities`, `insert_assets`.
- **Scene writes**: `add_scenes`, `remove_scenes`, `update_scenes` for multi-scene work; `add_scene`, `remove_scene`, `update_scene` are one-scene convenience wrappers that still use batched bridge commands internally.

## One wave per operation type

- **Creates**: **`add_entities`** for new entities, **`insert_assets`** for asset-backed entities. Order parents before children, and use `parentIndex` when the parent row is in the same wave.
- **Removals**: **`remove_entities`** with every target `entityId` from the same scene in one call.
- **Entity property updates**: **`update_entities`**, with every patch for the task in one call's `updates` array. Each patch can target different `entityIds`. Set layout and payloads via `overrides` on **`add_entities`** at create time so fewer follow-up updates are needed at all.
- **Reparenting**: **`update_entities`** with `propertyPath: "parentEntityId"` (`""` for root, or the target parent id). One wave for every reparent in the task.
- **Asset insertions**: one **`insert_assets`** call for the full insertion wave. Rows may each set `sceneId`; an optional top-level `sceneId` fills in the rows that omit it. The MCP server forwards **one bridge `insertAssets` command per distinct scene**, so batch at the tool level and let the server split.
- **Scenes**: **`add_scene`** / **`update_scene`** / **`remove_scene`** for one scene, and the plural forms when more than one scene is involved.

## Verification (debugging only)

`get_entity` and `list_entities` are **not** required after every write. Reach for them when you suspect a value did not apply, an entity is missing, or you are debugging layout. **`add_entities`** / **`remove_entities`** / **`insert_assets`** already re-check existence against the editor and report `verified` / `fallbackUsed`, so re-verifying every wave duplicates that work and adds latency.

`{"success": true}` from the bridge means the editor accepted the command, nothing more. When the viewport disagrees, that is when to read state.

Use **`bridge_status`** for connection and queue problems, and **`validate_patch`** before a write when a GUI path or a schema-safe value is in doubt.

Before a bulk change, use `get_story_state`, `get_scene` or `get_entity` when scene ids, entity ids or structure are not already in your context.

## Symptom → cause → fix

Start here when a write "worked" but the result is wrong. Most of these fail silently: the tool returns success and the viewport disagrees.

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| GUI patch applied, nothing changed | Path has no slot (`gui.currentValue.width` instead of `gui.currentValue.desktop.default.width`) | Re-patch with the full slot; run `validate_patch` first |
| GUI entity exists but is invisible or clipped | Parent `GUI_CONTAINER` is still the 150 × 150 default with `overflow: "scroll"` | Set the parent's `width` / `height` and `overflow: "visible"`, see the [parent chain table](gui-design-best-practices.md#layout-troubleshooting-parent-chain) |
| Button renders as a text link | No explicit `height`; the container collapsed to padding + line height | Set `height` (60–80 px at 1080p) |
| `width: "100%"` resolves to the wrong size | No numeric **anchor** in the ancestor chain | Give the nearest card/panel a numeric width, or parent under `GUI_SCREEN` |
| Text clipped or not wrapping | `lineHeight` below the glyph height, or missing `whiteSpace: "normal"` / `width` | Set `lineHeight` ≥ `fontSize` + ~4 px, `whiteSpace: "normal"`, explicit `width` |
| Localized text never appears | Key written as `"en_US"` | Use `"en-US"` (hyphen) |
| Icon renders as a right arrow | `iconSrc` is not a valid Lucide name, and invalid values fall back to `ArrowRight` | Correct the name, see the [icon list](gui-design-best-practices.md#icons-use-gui_icon-never-a-glyph-in-gui_text) |
| Primitive did not change size | Resized via `geometry` fields, which are export metadata | Set `scale` |
| Model invisible or fills the whole scene | GLB authored in non-standard units | Read `scale.currentValue`, apply a corrective scale, see [models-common.md](../references/entities/models/models-common.md#scale-arbitrary-authored-units--models-may-appear-invisible-or-giant) |
| World-space GUI is tiny or unreadable | Transform micro-scaled (e.g. `[0.004, 0.004, 0.004]`) to fake pixel units | Reset `scale` to `[1, 1, 1]`; size with GUI `width` / `height` |
| Lottie or sprite shows nothing | No asset bound, or `animations` was replaced with a partial array | Bind the asset; send the complete clip array, see [animated-common.md](../references/entities/animated/animated-common.md) |
| Lights look right, no shadows | Scene `shadowsEnabled` is off | `update_scene` → `shadowsEnabled: true` |
| Physics bodies do not move | Scene `physics.enabled` is off | `update_scene` → `physics.enabled: true` |
| Children render in the wrong order | Sibling sequence is layout order; re-added entities append to the end | Re-add the affected siblings in the intended order |
| Entity landed at the scene root instead of under its parent | The requested parent is a **leaf** | Parent under a `GROUP` and make them siblings, see [which types accept children](../references/entities/common.md#which-types-accept-children) |
| Panorama came in as `GUI_IMAGE` | The scene already had a panorama, so inference fell through | Insert with `forceEntityType: "PANORAMA"` |
| Asset upload rejected | Extension outside the accepted list | Check [assets-common.md](../references/assets/assets-common.md#import-workflow); convert first |
| `remove_assets` reports `blocked` | The asset is used by a story, prefab, or bundle | Report the named scenes/stories to the user; do not retry |
| Editor disconnected mid-wave | Wave too large, or the editor crashed while rendering | Reconnect, check `bridge_status`, retry in smaller waves |
| Overlapping transparent surfaces flicker | Draw order, not position | Set `renderOrder`, see [common.md](../references/entities/common.md#render-order) |

If a value did not stick, re-apply the fix in a **single** `update_entities` call.

## GUI on create

Pass `gui` (and other fields) in **`overrides` on each row of `add_entities`**. The MCP server deep-merges `overrides.gui.currentValue` with per-type defaults. Getting layout right at create time avoids a second `update_entities` wave.

## Child ordering in `add_entities`

Children render in the order they appear in the parent's children list. In flex layouts this is the visual order: a `flexDirection: "column"` panel with children added as `[Label, Question, Answers]` renders top-to-bottom in that sequence; add them as `[Answers, Label, Question]` and the buttons appear above the question text. The same principle extends to paint order, z-stacking, and any other context where sibling sequence is meaningful. Parents must always precede their children within a wave.

**Re-adding a removed entity appends it to the end.** If `[A, B, C]` exists and you remove then re-add `B`, the result is `[A, C, B]`. To restore the order, remove all out-of-sequence siblings and re-add them in the right sequence.

## Read before removing or re-adding entities

Before removing an entity for any reason (ordering fix, reparenting, style correction), call `get_entity` on the **parent** to capture the full property set of all children. The MCP carries over no data from a removed entity, so every property from the original, including `height`, `positionType`, `justifyContent` and every other GUI field, must be restated explicitly in the new `overrides`. Omitted properties revert to type defaults and are often visually wrong: a button without explicit `height` collapses to `padding + lineHeight` and looks like a text link.
