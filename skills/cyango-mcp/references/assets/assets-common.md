# Assets (MCP list/insert/import)

Use this guide when working with editor assets through MCP.

## Core tools

- `list_asset_providers` — list the external providers this workspace can browse and what each supports.
- `search_provider_assets` — search one provider for free stock assets; results are insertable by id for 10 minutes.
- `list_assets` — list assets from:
  - story assets (`activeStoryJson.assets`)
  - user library assets (`getAssets(folderId, page, perPage, filters)`)
  - both merged
- `insert_assets` — insert one or many assets in one batched call. Each row may set `sceneId`; optional top-level `sceneId` is the fallback for rows that omit it, so **one call can target one or more scenes** (the MCP server sends one bridge `insertAssets` per distinct scene).
- `upload_assets` — upload assets from a local path, URL, or directory through the editor upload pipeline. Returns uploaded asset IDs and can optionally chain a shared insert.
- `remove_assets` — delete one or more library assets by ID. Returns structured outcomes: `deleted[]`, `blocked[]` (with scene/story names), or `partialFailures[]`. **Always surface `blocked[]` to the user. Never retry without the user first removing the asset from the named scenes or stories.**

## `list_assets` input

```ts
{
  scope: "story" | "library" | "both", // default: "both"
  category?: string,
  folderId?: string, // required for library/both
  fileTypes?: string[],
  page?: number, // default 1
  perPage?: number, // default 12
  search?: string
}
```

## `insert_assets` input

```ts
{
  sceneId?: string, // default scene when a row omits sceneId
  inserts: Array<{
    assetId: string,
    sceneId?: string, // override per row for multi-scene batches
    parentEntityId?: string,
    parentIndex?: number, // in-batch parent reference (same scene as the row)
    position?: [number, number, number],
    rotation?: [number, number, number],
    scale?: [number, number, number],
    forceEntityType?: EntityTypes,
    attachToStory?: boolean, // default true
    assetFolderId?: string, // optional library fetch hint
    page?: number,
    perPage?: number
  }>
}
```

## `upload_assets` input

```ts
{
  items: Array<{
    source: "path" | "url" | "directory",
    value: string,
    name?: string,
    mimeType?: string,
    assetFolderId?: string,
    recursive?: boolean, // directory only; default false
    fileTypes?: string[], // mime prefixes ("image/") or extensions ("jpg", "glb")
    maxFiles?: number, // directory cap; default 100
    insert?: {
      sceneId: string,
      parentEntityId?: string,
      position?: [number, number, number],
      rotation?: [number, number, number],
      scale?: [number, number, number],
      forceEntityType?: EntityTypes,
      attachToStory?: boolean
    }
  }>
}
```

## Import workflow

- MIME inferred from file extension; override with `mimeType` when needed.
- Directory mode skips dot-files, subdirs (unless `recursive: true`), and types the caller filtered out with `fileTypes`.
- The **editor** is the authority on what may be uploaded and rejects anything outside this list:

  | Category | Extensions |
  |----------|------------|
  | Image | `png`, `jpg`, `jpeg`, `webp`, `bmp`, `tiff`, `gif` |
  | Vector | `svg` |
  | HDR | `hdr`, `exr` |
  | Video | `mp4`, `webm`, `mov` |
  | Audio | `mp3`, `wav`, `aac` |
  | 3D model | `glb` |
  | Splat | `splat`, `ply`, `ksplat`, `spz`, `sog`, `zip` (SOG bundle) |
  | Lottie | `json` |
  | Font | `ttf` |
  | Others | `vtt` |

  Note what is **not** accepted: `gltf`, `ktx2`, `avi`, `m3u8`. A rejected upload returns the supported-type list in the error.
- Two extensions are classified by **content**, not extension: a `.json` is a Lottie only if it parses as a Bodymovin document (otherwise font/data), and a `.zip` is a splat only if it holds a SOG bundle (otherwise a plain file). Check `assetCategory` on the returned asset before inserting.
- Large uploads take time and may timeout (30 s per chunk). Prefer smaller files when possible.
- Default upload folder is `My Uploads`; pass `assetFolderId` to target a specific library folder.
- Per-batch cap: 200 MiB and 100 files by default (`CYANGO_MCP_MAX_UPLOAD_BYTES` / `CYANGO_MCP_MAX_UPLOAD_FILES` on the MCP server raise them; the editor's own limit is higher).

## Splat formats

Splats can carry several source formats on one asset (`rad`, `spz`, `sog`, `ply`). The renderer picks RAD-LoD first; override per entity with `splat.currentValue.sourcePreference` (`SplatSourceTypes`: `rad` | `spz` | `sog` | `ply`). An unavailable preference falls back to the default selection. Uploading a `.zip` SOG bundle is upload-only — nothing renders until the worker finishes converting it.

## Multi-file insert semantics

`insert` on an item that produces multiple assets (especially `source: "directory"`) is applied as-is to every uploaded asset:

- same `position`
- same `rotation`
- same `scale`
- same `forceEntityType`
- same `attachToStory`

Result: assets stack at the same transform. This is intentional; there is no per-index array form.

When assets need different placements:

1. Call `upload_assets` without `insert` to get asset IDs in batch order.
2. Call `insert_assets` once with all rows, using per-row `position` / `rotation` / `scale` and per-row `sceneId` when inserting into more than one scene.
3. Optionally call `update_entities` for fine-tuning after entities exist.

## `list_assets` response shape

Each row is a lite projection, not the full `IAsset`:

```ts
{ id, name, assetCategory, mimeType, thumbnailUrl, assetFolderId, ready }
```

`ready: false` means the worker is still converting — insert it anyway (the entity binds by id) but expect the viewport to fill in late. Credits/license metadata on provider assets is **not** in this projection; read it in the editor's asset info panel.

## Provider (public) assets

Free stock assets from external providers (Pexels, Poly Haven, …) are searchable and insertable over MCP. Three steps:

1. **`list_asset_providers`** — returns the configured providers and the categories each supports. Call it first; never assume a provider name or that a provider can serve the category you want.
2. **`search_provider_assets`** — one provider per call:

   ```ts
   { provider: "polyhaven", query?: string, assetCategory?: string, page?: number, perPage?: number }
   ```

   Each item comes back as `{ id, name, assetCategory, thumbnailUrl, license, attribution, sourceUrl, needsImport }`.
3. **`insert_assets`** — pass the item `id` in an ordinary insert row. No separate tool, and the same batching rules apply.

```json
{
  "sceneId": "scene_a1b2",
  "inserts": [{ "assetId": "<id from search>", "position": [0, 0, -3] }]
}
```

### What happens on insert

| `needsImport` | Behaviour |
|---------------|-----------|
| `false` | Hotlinked — inserted immediately, the file stays on the provider's CDN. |
| `true` | Copied into the user's library first (download → convert → asset), then inserted. All 3D models are in this group. |

An import runs server-side and can take **minutes** for a large model. The bridge streams progress while it works, so the call does not time out — but expect a long wait and do not retry in parallel.

Search results stay insertable for **10 minutes**. After that the id no longer resolves and `insert_assets` reports it in `missing` with a note to search again.

### Attribution is not optional

Every item carries `license` and `attribution` (`author`, `sourceUrl`). Some providers require credit and some licenses require it legally. **Tell the user the author and licence of everything you place**, and mention when a licence requires visible credit in the published story. Do not strip or invent this metadata — the editor shows it in the asset info panel, and there is a copy-credits button there.

### Choosing hotlink vs a copy

Hotlinked assets depend on the provider staying up, which is fine while drafting but a dependency the user does not control once published. If they ask for something durable, or the story is heading to publish, prefer assets you can copy — or upload the file into their library with `upload_assets`.

## Story vs library

- Story assets live in `activeStoryJson.assets` and are immediately available for insert.
- Library assets require `folderId` to page through `/assets/getAssets/:folderId`.
- `insert_assets` auto-attaches library assets into the open story by default (`attachToStory !== false`).

## Asset category -> default entity type

Editor infers entity type from asset category:

- `VIDEO` -> `PANORAMA_VIDEO` / `PANORAMA_180_VIDEO` / `FLAT_VIDEO` (flat scenes only) / `GUI_VIDEO`
- `IMAGE` -> `PANORAMA` / `PANORAMA_180` / `FLAT_IMAGE` (flat scenes only) / `GUI_IMAGE`
- `VECTOR` -> `FLAT_IMAGE` (flat scenes only) / `GUI_VECTOR`
- `AUDIO` -> `AUDIO_GLOBAL`
- `MODEL_3D` -> `CUSTOM_3D_MODEL`
- `SPLAT` -> `SPLAT`
- `FONT` -> `TEXT_3D`
- `LOTTIE` -> `LOTTIE`
- `SUBTITLES` -> `SUBTITLE`
- `HDR` -> `HDR`
- `OTHERS` -> no entity; the insert row fails

Use `forceEntityType` when you need to override default inference.

## Image and video entity types — trust the editor; `FLAT_*` scope

The editor's default inference for a plain image asset is **`GUI_IMAGE`** outside panorama cases — correct for most work. **Do not pass `forceEntityType` unless a row below matches.** Agents must not force `FLAT_IMAGE` or `FLAT_VIDEO` just because those enums exist.

**`FLAT_IMAGE` and `FLAT_VIDEO` belong only inside flat scenes.** They are not for wall posters, billboards, or arbitrary textured planes in navigable 3D tours — use **`GUI_IMAGE`/`GUI_VIDEO`**, **`PRIMITIVE_*`** with materials, **`CUSTOM_3D_MODEL`**, etc. Do not document flat scenes here beyond this rule; rely on studio scene typing when in doubt.

**When `forceEntityType` IS appropriate — images:**

| Situation | `forceEntityType` |
|-----------|-------------------|
| 360° equirectangular scene background | `PANORAMA` |
| 180° equirectangular (half-sphere) background | `PANORAMA_180` |
| Only inside flat scenes — flat media layer (editor normally infers; rarely force) | `FLAT_IMAGE` |
| SVG/vector in UI | `GUI_VECTOR` |
| All other image placements | omit — let the editor infer (typically `GUI_IMAGE`) |

**When `forceEntityType` IS appropriate — videos:**

| Situation | `forceEntityType` |
|-----------|-------------------|
| 360° equirectangular video background | `PANORAMA_VIDEO` |
| 180° equirectangular video background | `PANORAMA_180_VIDEO` |
| Only inside flat scenes — flat media layer (editor normally infers; rarely force) | `FLAT_VIDEO` |
| All other video placements | omit — let the editor infer (typically `GUI_VIDEO`) |

If intent is ambiguous, ask rather than guessing — and never use `FLAT_IMAGE` or `FLAT_VIDEO` outside flat scenes or as a fallback.

## Batch rules

- Prefer one `insert_assets` call for the full insertion wave (all rows and scenes in one batch when practical), not repeated single-row inserts or redundant extra tool calls.
- For parent-child chains within one batch, use `parentIndex` so parents can be referenced before IDs are known.
- Avoid interleaving `add_entities` and `insert_assets` against the same target chain in separate calls.

## `remove_assets` input

```ts
{
  assetIds: string[] // min 1 — library asset IDs to delete
}
```

## `remove_assets` response

The tool always returns structured JSON. Blocked assets do **not** fail the call — read the fields below.

```ts
{
  deletedCount: number,
  deleted: string[],
  blockedCount: number,
  blocked: Array<{
    assetId: string,
    assetName?: string,
    blockedBy: Array<{
      type: "activeStory" | "story" | "prefab_or_bundle",
      id?: string,           // story id (type=story)
      name?: string,         // story name (type=story)
      scenes?: Array<{ sceneId: string, sceneName: string }>,
      note?: string,         // type=activeStory when attached but not placed in any scene
      reason?: string        // type=prefab_or_bundle
    }>
  }>,
  partialFailureCount: number,
  partialFailures: Array<{ assetId: string, error: string }>,
  allSucceeded: boolean      // true only when every requested asset is in deleted[]
}
```

**How to read `blockedBy`:**

| `type` | Meaning | Tell the user |
|--------|---------|---------------|
| `activeStory` | Asset is attached to the **open** story | Scene names in `scenes[]`; if empty, `note` explains it's attached but unplaced |
| `story` | Asset is used in **another** story | Story `name`; scene names in `scenes[]` when present |
| `prefab_or_bundle` | Asset is locked by a prefab or published bundle | `reason` message |

**Agent rules:**
- Use **`allSucceeded`** to judge the whole batch. Mixed batches are normal — some in `deleted[]`, others in `blocked[]`.
- If an asset is in the open story, you see `activeStory` only (not other stories that may also reference it).
- **`partialFailures`** are real errors (not found, network, etc.) — distinct from `blocked`.
- Always tell the user which scenes or stories are blocking. Never silently skip a blocked asset.
