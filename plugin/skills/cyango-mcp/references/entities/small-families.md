# Small entity families

One table per family for the types whose payload is small enough not to need its own file: structure, panorama, 3D text, audio, environment, camera/player/webcam/face, maps, subtitle.

Families with real depth have their own docs: [gui-common.md](gui/gui-common.md) + [gui-properties.md](gui/gui-properties.md), [primitives-common.md](primitives/primitives-common.md), [lights-common.md](lights/lights-common.md), [models-common.md](models/models-common.md), [animated-common.md](animated/animated-common.md). Creation defaults for every non-GUI type are in [non-gui-defaults.md](non-gui-defaults.md).

---

## Structure — `GROUP`, `GROUP_BOX`, `NONE`

| Type | Role | Notes |
|------|------|-------|
| `GROUP` | General-purpose grouping entity | No renderable mesh. `position` / `rotation` / `scale` define the frame for child entities. Use for composites: multiple 3D objects, GUI with 3D entities, or mixed content. |
| `GROUP_BOX` | Group with box visualization / bounds | Same hierarchy as `GROUP`; may carry `geometry` / `material` for a visible wireframe. |
| `NONE` | Non-rendering entity | Anchor for `actions`, physics sensors, or template slots. No `geometry` expected. Overlaps with `isPlaceholder` on `IEntity`. |

---

## Panorama — `PANORAMA`, `PANORAMA_VIDEO`, `PANORAMA_180`, `PANORAMA_180_VIDEO`

360° and 180° image and video on sphere or dome meshes. Shared fields:

- `assetDomElementId` — ties the entity to `storyJson.assets`.
- `media?: IAnimation<IMediaClip>` — clip timing, trim, volume, loop (video types).
- `material` / `geometry` — often animated for projection.

| Type | Role | Scene pairing |
|------|------|---------------|
| `PANORAMA` | 360° equirectangular still image | `PANORAMA_360` |
| `PANORAMA_VIDEO` | 360° video sphere; playback via `media.currentValue` | `PANORAMA_360` |
| `PANORAMA_180` | 180° hemisphere still | `PANORAMA_180_SCENE` |
| `PANORAMA_180_VIDEO` | 180° video dome | `PANORAMA_180_SCENE` |

MCP paths: `media.currentValue.*`, `material.currentValue.*`, transforms.

Insert panoramas with `insert_assets` and `forceEntityType` — the editor infers `PANORAMA` from a 2:1 image only when the scene has no panorama yet. Inserting a panorama into a panorama scene also sets the scene's `thumbnailAsset`.

---

## 3D text — `TEXT_3D`, `TEXT_3D_VIDEO`

Both use `text3D?: IAnimation<IEntityText3D>` plus `material`, `geometry`, and transforms.

`IEntityText3D`:

| Field | Notes |
|-------|-------|
| `text` | `LocalizationObject` — copy per language. Runtime key is `"en-US"` (hyphen). |
| `letterSpacing` / `lineHeight` | Typography spacing. |
| `bevelEnabled` / `bevelSize` / `bevelThickness` | Extruded mesh bevel. |

| Type | Role |
|------|------|
| `TEXT_3D` | Extruded 3D text mesh. `text3D` for string + bevel; `material` for face color / metalness. `actions` for click behavior. |
| `TEXT_3D_VIDEO` | 3D text with video on the glyph surfaces. Adds `media`; timeline and media actions apply. |

MCP paths: `text3D.currentValue.text`, `material.currentValue`, `media.currentValue` (`TEXT_3D_VIDEO`).

---

## Audio — `AUDIO_GLOBAL`, `AUDIO_POSITIONAL`

Both use `media?: IAnimation<IMediaClip>` for the clip (file, trim, volume, loop). Playback is driven by entity media actions (`PLAY_ENTITY_MEDIA`, `PAUSE_ENTITY_MEDIA`, `STOP_ENTITY_MEDIA`, `MUTE_ENTITY_MEDIA`, `UNMUTE_ENTITY_MEDIA`).

| Type | Role | Extra fields |
|------|------|--------------|
| `AUDIO_GLOBAL` | Stereo / non-spatial audio (music, VO bed) | `media` only — no spatial attenuation. |
| `AUDIO_POSITIONAL` | 3D positional audio with distance falloff | `audio3D.currentValue` — `distance`, `rolloffFactor`, `reverb`, `echo`, `noise`. `position` is the emitter. |

---

## Environment — `SKYBOX`, `HDR`

| Type | Payload | Key fields |
|------|---------|------------|
| `SKYBOX` | `skybox?: IAnimation<IEntitySkybox>` | Procedural sky — sun angles, `rayleigh`, `mieCoefficient`, `turbidity`, `distance` (default `4000`). Pair with `DIRECTIONAL_LIGHT` for shadows. |
| `HDR` | `hdr?: IEntityEnvironment` | HDRI environment map — `background`, `backgroundBlurriness`, `backgroundIntensity`, `environmentIntensity`. Needs an `AssetCategories.HDR` asset (`.hdr` / `.exr`); the entity renders nothing without one. |

Both are usually large or infinite-scale; transform is minimal or rotation-only.

---

## Camera, player, webcam, face

| Type | Payload | Key fields |
|------|---------|------------|
| `CAMERA` | `camera?: IAnimation<IEntityCamera>` | `type` (perspective / orthographic), `fov`, `near`, `far`, `controls` (`ICameraControls` — orbit, damping, targets). Pairs with `CAMERA_LOOK_AT` actions. Auto-created per scene. |
| `PLAYER` | `player?: IAnimation<IEntityPlayer>` | `PlayerType` (`FIRST_PERSON`, `THIRD_PERSON`, `FREE_CAMERA`), height, radius, jump, `wasd` / `joystick` / `xrLocomotion` speeds, `physics`. One per scene. |
| `WEBCAM` | `webcam?: IEntityWebcam` | `cameraFacingUser`, `mirrored`. |
| `FACE_MESH` | *(transform follows the AR face anchor)* | Face-tracking mesh overlay. Call `get_entity` on an existing one to read the keys a story actually uses rather than assuming a schema. |

---

## Subtitle — `SUBTITLE`

| Type | Role | Key details |
|------|------|-------------|
| `SUBTITLE` | Caption track on the timeline | `subtitles?: IAnimation<IEntityTrack>` with `text` per keyframe. Bind a `.vtt` / `.srt` asset, or key the text directly. |

---

## Maps — `MAP_2D`, `MAP_3D`

Both use `mapProperties?: IEntityMapProperties` for the geo anchor.

| Field | Notes |
|-------|-------|
| `latitude` / `longitude` / `altitude` | WGS84-style anchor. |
| `geolocationPinAssetId` | Asset id for the map pin graphic. |

| Type | Role |
|------|------|
| `MAP_2D` | 2D map view (slippy tiles / flat map plane). Created with the scene in `MAP_2D_SCENE`. |
| `MAP_3D` | 3D map (terrain / globe / extruded buildings). Position and scale frame the volume. |

Transform offsets the map frame within the scene. The `CENTER_GPS` action recenters the active map at runtime — see [actions.md](../actions/actions.md#map).
