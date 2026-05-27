# Custom Code Runtime API

**This file covers:** the sandbox environment (available globals, blocked globals, browser/device helpers) and the complete `cyango` namespace reference for `CUSTOM_CODE` actions.

Read this file before writing, reviewing, debugging, or patching custom code. Do not guess API names from JavaScript knowledge — these come from Cyango's Monaco definitions and the story-player runtime.

`cyango` exists only in `CUSTOM_CODE` actions. Story Head/Footer code uses the same sandbox evaluator but does not receive `cyango`.

## Sandbox environment

Custom code runs inside an async function body in the sandbox evaluator.

Available globals:

- `cyango` for `CUSTOM_CODE` actions only (not available in Head/Footer code).
- `console.log`, `console.warn`, `console.error`, `console.info`; output is namespaced as `[plugin> custom-code]`.
- `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval`; delays are capped at 60 000 ms.
- Locals, functions, classes, arrays, objects, promises, and normal JavaScript built-ins.

## Runtime shape

```ts
cyango: {
  uiState: IUIState;
  storyState: IStoryState;
  timelineState: ITimelineState;
  types: typeof import('@cyango/cyango-shared');
  utils: IUtils;
}
```

The editor type definitions are slightly broader than the current runtime object. Runtime-confirmed APIs are marked below. If a definition is listed as type-only, treat it as an editor hint until runtime code confirms it exists.

## `cyango.types`

Runtime-confirmed enum namespaces. Use these instead of raw strings to get Monaco autocomplete and avoid typos.

```js
await cyango.storyState.triggerAction({
  id: 'open-url-from-code',
  type: cyango.types.ActionType.OPEN_URL,
  eventType: cyango.types.EventType.ON_CLICK,
  toExternalUrl: 'https://example.com'
});
```

### `ActionType`

Set as `action.type`. String value equals the member name for all members.

| Member | What it does |
|--------|--------------|
| `NONE` | No-op. |
| `CHANGE_ENTITY_PROPERTY` | Sets a property on one or more target entities (`targetEntitiesIds`, `entityProperties`). |
| `RESET_ENTITY_PROPERTIES` | Resets entity properties to their original state. |
| `OPEN_MODAL` | Opens an `IModal` overlay. |
| `CLOSE_MODAL` | Closes the active modal. |
| `OPEN_URL` | Opens `toExternalUrl` in a new tab or modal. |
| `CHANGE_ACTIVE_LANGUAGE` | Switches story language; also triggers `ON_LANGUAGE_CHANGED` on listening actions. |
| `GO_TO_SCENE` | Navigates to `targetSceneId`. Optionally pass `sceneTransition` and `duration`. |
| `NEXT_SCENE` | Navigates to the next scene in order. |
| `PREVIOUS_SCENE` | Navigates to the previous scene. |
| `TRIGGER_ENTITY` | Fires all actions on `targetEntitiesIds`. |
| `ENTER_VR` | Enters VR mode. |
| `ENTER_AR` | Enters AR mode. |
| `ENTER_XR` | Enters VR or AR (whichever is available). |
| `EXIT_XR` | Exits VR or AR. |
| `DELAY` | Waits `duration` ms before the next action in the sequence. |
| `SHOW_ENTITY` | Makes `targetEntitiesIds` visible. |
| `HIDE_ENTITY` | Hides `targetEntitiesIds`. |
| `PLAY_ENTITY_MEDIA` | Plays media on target entity. |
| `PAUSE_ENTITY_MEDIA` | Pauses media on target entity. |
| `STOP_ENTITY_MEDIA` | Stops media on target entity. |
| `MUTE_ENTITY_MEDIA` | Mutes media on target entity. |
| `UNMUTE_ENTITY_MEDIA` | Unmutes media on target entity. |
| `CAMERA_LOOK_AT` | Moves/rotates camera to the `lookAt` transform over `duration`. |
| `CUSTOM_CODE` | Runs `customCode.code` in the sandbox. This action's own type. |
| `PLAY_TIMELINE` | Plays the scene timeline. |
| `PAUSE_TIMELINE` | Pauses the scene timeline. |
| `STOP_TIMELINE` | Stops and resets the scene timeline. |
| `MUTE_TIMELINE` | Mutes scene timeline audio. |
| `UNMUTE_TIMELINE` | Unmutes scene timeline audio. |
| `OPEN_PRODUCT` | Opens an XR Store product overlay. |
| `INSTANTIATE_PREFAB` | Pastes a prefab snapshot from `storyJson.prefabs` into the scene. |

### `EventType`

Set as `action.eventType`. Controls when the action fires. String value equals the member name for all members.

| Member | When it fires |
|--------|---------------|
| `NONE` | Never (disabled). |
| `ON_CLICK` | Pointer click / tap on entity. |
| `ON_DOUBLE_CLICK` | Double-click / double-tap. |
| `ON_CONTEXT_MENU` | Right-click on entity. |
| `ON_POINTER_ENTER` | Pointer enters entity bounds. |
| `ON_POINTER_OVER` | Pointer is hovering over entity (continuous). |
| `ON_POINTER_DOWN` | Pointer button pressed on entity. |
| `ON_POINTER_UP` | Pointer button released on entity. |
| `ON_POINTER_MOVE` | Pointer moves while over entity. |
| `ON_POINTER_LEAVE` | Pointer leaves entity bounds. |
| `ON_CONTAINER_SCROLL` | GUI container is scrolled. |
| `ON_WHEEL` | Mouse wheel on entity. |
| `ON_SCENE_ENTER` | Scene starts loading / entering. |
| `ON_SCENE_READY` | Scene assets are fully loaded and the scene is ready. |
| `ON_SCENE_EXIT` | Scene is about to be exited. |
| `ON_LANGUAGE_CHANGED` | Story language was switched. |
| `ON_ENTER_VR` | User entered VR. |
| `ON_ENTER_AR` | User entered AR. |
| `ON_EXIT_XR` | User exited VR or AR. |
| `ON_SCENE_POSITIONED` | Scene placed / anchored in AR world tracking. |
| `ON_SCENE_TIMELINE_START` | Scene timeline begins playing. |
| `ON_SCENE_TIMELINE_END` | Scene timeline reaches its end. |
| `ON_ENTITY_ADDED` | Entity added to the scene (e.g. after prefab instantiation). |
| `ON_ENTITY_READY` | Entity is mounted and ready in the player. |
| `ON_ENTITY_REMOVED` | Entity removed from the scene. |
| `ON_DATE_RANGE` | Current date is within `conditions.dateRanges`. |
| `ON_GEOLOCATION` | Device location matches `conditions.geolocation` radius. |

### `PlayingModes`

Use with `cyango.timelineState.playingMode` or `setPlayingMode`. String value equals the member name for all members.

| Member | Meaning |
|--------|---------|
| `PLAY` | Timeline is playing. |
| `PAUSE` | Timeline is paused at current position. |
| `STOPPED` | Timeline is stopped and reset to the start. |
| `NEEDS_USER_INTERACTION` | Waiting for a user gesture before playback can start (browser autoplay policy). |

### `TransitionType`

Set as `action.sceneTransition` on `GO_TO_SCENE` actions, or passed to `setActiveScene`. String value equals the member name for all members.

| Member | Visual |
|--------|--------|
| `NONE` | Instant cut — no animation. |
| `FADE` | Fade to black, then fade in. |
| `ZOOM_OUT_FADE_ZOOM_IN` | Zoom out → fade → zoom in on arrival. |
| `ZOOM_IN_FADE_ZOOM_OUT` | Zoom in → fade → zoom out on arrival. |
| `ZOOM_IN_FADE` | Zoom in then fade out. |
| `ZOOM_OUT_FADE` | Zoom out then fade out. |

### `EntityTypes`

Read from `entity.entityType`. Use to filter or identify entity kinds.

**Containers:** `GROUP`, `GROUP_BOX`

**Primitives:** `PRIMITIVE_CUBE`, `PRIMITIVE_SPHERE`, `PRIMITIVE_CYLINDER`, `PRIMITIVE_PLANE`, `PRIMITIVE_CONE`, `PRIMITIVE_RING`, `PRIMITIVE_CIRCLE`, `PRIMITIVE_ROUNDED_PLANE`, `PRIMITIVE_CURVED_PLANE`, `PRIMITIVE_CAPSULE`

**Panoramas:** `PANORAMA`, `PANORAMA_VIDEO`, `PANORAMA_180`, `PANORAMA_180_VIDEO`

**Hotspots:** `HOTSPOT`, `HOTSPOT_VIDEO`, `HOTSPOT_AREA`, `HOTSPOT_VECTOR`

**3D models and text:** `CUSTOM_3D_MODEL`, `MODEL_3D__CHILD` (child node of a loaded model), `TEXT_3D`, `TEXT_3D_VIDEO`

**Flat media (flat scenes only):** `FLAT_IMAGE`, `FLAT_VIDEO`

**Other visuals:** `SPRITE`, `SPLAT`

**Lights:** `POINT_LIGHT`, `SPOT_LIGHT`, `DIRECTIONAL_LIGHT`, `VOLUMETRIC_SPOT_LIGHT`, `AMBIENT_LIGHT`, `TUBE_LIGHT`

**Environment:** `SKYBOX`, `HDR`

**Audio:** `AUDIO_GLOBAL`, `AUDIO_POSITIONAL`

**Map:** `MAP_2D`, `MAP_3D`

**Camera / player / tracking:** `CAMERA`, `PLAYER`, `WEBCAM`, `FACE_MESH`

**Subtitle:** `SUBTITLE`

**GUI (UIKit):** `GUI_SCREEN` (scene root, one per scene, cannot be removed), `GUI_CONTAINER`, `GUI_TEXT`, `GUI_CHECKBOX`, `GUI_SWITCH`, `GUI_IMAGE`, `GUI_VECTOR`, `GUI_VIDEO`, `GUI_ICON`, `GUI_SLIDER`, `GUI_INPUT`

**Other:** `NONE`

### `MaterialTypes`

Read/set as `entity.material.currentValue.materialType`. String value equals the member name except: `LEFTRIGHT` → `"LEFT_RIGHT"`, `TOPBOTTOM` → `"TOP_BOTTOM"`.

| Member | When to use |
|--------|-------------|
| `NONE` | No material override. |
| `COLORKEY` | Chroma-key / green-screen colour removal. |
| `ALPHA` | Alpha/transparency pass-through. |
| `LEFTRIGHT` | Stereoscopic left-right split texture. |
| `TOPBOTTOM` | Stereoscopic top-bottom split texture. |
| `FLAT` | Unlit (`MeshBasicMaterial`). |
| `STANDARD` | Physically-based lit (`MeshStandardMaterial`). |
| `PHONG` | Specular-highlight lit (`MeshPhongMaterial`). |
| `LAMBERT` | Diffuse-only lit (`MeshLambertMaterial`). |
| `OCCLUSION` | Invisible occluder; hides objects rendered behind it. Uses `colorWrite: false`. |
| `TRANSPARENT` | Fully transparent (`MeshBasicMaterial`, `transparent: true`). |

### `BreakpointStateTypes`

Use with `cyango.uiState.selectedBreakpoint` or `setSelectedBreakpoint`. Note: string values are lowercase.

| Member | String value |
|--------|-------------|
| `MOBILE` | `"mobile"` |
| `TABLET` | `"tablet"` |
| `DESKTOP` | `"desktop"` |

### `SceneTypes`

Read from `scene.sceneType`. String value equals the member name except: `LIVESTREAM_180_VIDEO` → `"LIVESTREAM_180_VIDEO_SCENE"`, `PANORAMA_180` → `"PANORAMA_180_SCENE"`.

| Member | Scene mode |
|--------|-----------|
| `PANORAMA_360` | 360° panorama (image or video). Camera fixed; user looks around. |
| `FLAT_SCENE` | Flat 2D-like scene; camera fixed, no orbit. Used for UI or video-style content. |
| `MODEL_VIEWER` | Camera orbits around a 3D model target. |
| `TOUR_3D` | First/third-person movement with physics colliders. |
| `LIVESTREAM_PANORAMA` | Livestream in 360° panorama mode. |
| `LIVESTREAM_FLAT_SCENE` | Livestream in flat scene mode. |
| `LIVESTREAM_180_VIDEO` | Livestream in 180° video mode. |
| `PANORAMA_180` | 180° panorama (image or video). |
| `MAP_2D_SCENE` | 2D map scene. |
| `MAP_3D_SCENE` | 3D map scene. |
| `WEBCAM_SCENE` | Live webcam feed scene. |
| `FACE_TRACKING_SCENE` | Face tracking AR scene. |
| `AR_WORLD_TRACKING_SCENE` | AR world tracking scene. |
| `PASSWORD_SCENE` | Password-gated entry scene. |
| `NOT_FOUND_SCENE` | Fallback / 404 scene. |

### `AssetCategories`

Use to filter `asset.assetCategory`. Note: `MODEL_3D` has string value `"3D Model"` — always use the enum member, not the string.

`IMAGE`, `VECTOR`, `HDR`, `VIDEO`, `AUDIO`, `MODEL_3D` (`"3D Model"`), `SPLAT`, `FONT`, `SUBTITLES`, `DOCUMENTS`, `OTHERS`

### `AssetFileTypes` / `AssetMimeTypes`

These enumerate every supported file extension and MIME type. Prefer `AssetCategories` for broad filtering; use these only when matching a specific format.

| Category | Extensions |
|----------|-----------|
| Image | `png`, `jpg`, `jpeg`, `gif`, `svg`, `webp`, `tiff`, `bmp`, `ico`, `heif`, `hdr` |
| Video | `mp4`, `webm`, `mov`, `avi`, `m3u8` |
| Audio | `mp3`, `wav`, `aac`, `ogg`, `m4a` |
| 3D model | `glb`, `gltf`, `fbx`, `obj` |
| Gaussian splat | `splat`, `ply`, `spz`, `ksplat`, `sog`, `rad` |
| Font | `ttf`, `otf`, `woff`, `woff2` |
| Subtitles | `vtt`, `srt` |
| Documents | `pdf`, `doc`, `docx`, `xls`, `xlsx`, `ppt`, `pptx`, `zip`, `rar` |
| Web / data | `html`, `css`, `js`, `json`, `xml`, `csv`, `txt`, `url` |

### `LanguageTypes`

Story localization codes. Member names use underscores; string values use BCP 47 hyphens.

`pt_PT` (`"pt-PT"`), `pt_BR` (`"pt-BR"`), `en_US` (`"en-US"`), `es` (`"es"`), `fr` (`"fr"`), `de` (`"de"`), `el` (`"el"`), `da` (`"da"`), `hi` (`"hi"`), `it` (`"it"`), `ja` (`"ja"`), `ko` (`"ko"`), `nl` (`"nl"`), `pl` (`"pl"`), `ru` (`"ru"`), `sv` (`"sv"`), `tr` (`"tr"`), `zh` (`"zh"`)

## `cyango.storyState`

Story state is the main runtime surface for reading the active story, switching scenes, triggering actions, mutating story JSON, and XR/map helpers.

### Runtime-confirmed readable state

| Property | Type / shape | Notes |
|----------|--------------|-------|
| `activeStoryJson` | `IStoryJson | null` | Full active story JSON. Read scenes, entities, assets, settings, prefabs from here. |
| `activeSceneId` | `string | null` | Current scene id. |
| `activeLanguage` | `LanguageTypes` | Current story language. |
| `availableLanguages` | `LanguageTypes[]` | Languages available in the story. |
| `assetRegistry` | runtime object | Runtime asset registry. Present at runtime, not in Monaco definition. Inspect defensively. |
| `currentSceneAssetIds` | runtime value | Asset ids used by current scene. Present at runtime, not in Monaco definition. |
| `allSceneAssetsReady` | `boolean` | Whether current scene assets are ready. |
| `XRStore` | `XRStore | undefined` | React XR store. Advanced XR only. |
| `storyQualityLevel` | `StoryQualityLevel` | `LOW = 0`, `MEDIUM = 1`, `HIGH = 2`, `ULTRA = 3`. |
| `isWebcamReady` | `boolean` | Webcam readiness. |
| `faceMeshScale` | `[number, number]` | Face mesh scale. |
| `webcamZPosition` | `number` | Webcam Z position. |
| `isVR` | `boolean` | Whether VR is active/enabled. |
| `isAR` | `boolean` | Whether AR is active/enabled. |
| `isMobileAR` | `boolean` | Whether mobile AR is active/enabled. |
| `arOriginState` | `{ isReadyToSetAROrigin?: boolean; isAROriginSet?: boolean }` | AR origin state. |

### Type-defined state

These are present in Monaco definitions. Use if the runtime context exposes them; otherwise prefer reading `activeStoryJson` directly.

| Property | Type / shape | Notes |
|----------|--------------|-------|
| `storyProperties` | `Partial<IStory> | null` | Story metadata/properties. |
| `visibleScenes` | `IScene[]` | Currently visible scenes. |
| `storyActivePage` | `StoryPageTypes` | Active story page. |
| `linkLookAtAngles` | `CameraTransform | undefined` | Camera transform used by link/navigation. |
| `currentSceneAssets` | `IAsset[]` | Current scene assets. |
| `readyAssets` | `{ assetDomElementId: string; ready: boolean }[]` | Per-asset readiness. |
| `storyPasswordError` | `boolean` | Story password error flag. |
| `teleportTargetPosition` | `Vector3 | undefined` | VR/AR teleport target. |
| `triggerEntities` | `Record<string, { triggered: boolean; eventType?: string }>` | Trigger state by entity id. |
| `openEntityModals` | `Record<string, boolean>` | Entity modal open state. |
| `hitTestMatrices` | `Partial<Record<XRHandedness, Matrix4 | undefined>>` | AR hit-test matrices. |
| `cameraAction` | `IAction | undefined` | Camera action in progress. |

### Navigation and story actions

| Method | Signature | Notes |
|--------|-----------|-------|
| `setActiveLanguage` | `(lang: LanguageTypes) => Promise<void>` | Switches language and triggers language-change behavior. |
| `setActiveScene` | `(sceneId: string, linkLookAtAngles?: CameraTransform, sceneTransitionType?: TransitionType, sceneTransitionDuration?: number) => Promise<void>` | Go to a scene. Prefer this over manually changing `activeSceneId`. |
| `setNextScene` | `() => void` | Type-defined only. Navigate to next scene. |
| `setPreviousScene` | `() => void` | Type-defined only. Navigate to previous scene. |
| `setStoryActivePage` | `(page: StoryPageTypes) => void` | Type-defined only. |
| `getStory` | `(storyId: string, previewToken?: string, storyPassword?: string) => Promise<void>` | Type-defined only. Usually not needed inside action code. |
| `shareStory` | `(storyId: string) => void` | Runtime-confirmed. |
| `likeStory` | `(storyId: string) => void` | Runtime-confirmed. |
| `triggerAction` | `(action: IAction, entityId?: string) => Promise<void>` | Runs an action object. Pass `entityId` when the action should execute as if from a specific entity. |
| `setTriggerEntities` | `(entityIds: string | string[], triggered: boolean, eventType?: string) => void` | Type-defined. Sets trigger state. |
| `setOpenEntityModals` | `(entityId: string, bool: boolean) => void` | Type-defined. |

Example:

```js
await cyango.storyState.setActiveScene('target-scene-id');
```

### Story JSON mutation

Use `updateStoryData` for runtime changes to story, scene, or entity data. This is not an MCP write; it mutates the running story state in the player.

```ts
type EntityPropertyPath = keyof IEntity | (string & {});
type ScenePropertyPath = keyof IScene | (string & {});

type UpdateTarget =
  | { type: 'story'; propertyPath: string; value: any }
  | { type: 'scenes'; sceneIds: string[]; propertyPath: ScenePropertyPath; value: any }
  | { type: 'entities'; entityIds: string[]; propertyPath: EntityPropertyPath; value: any };

interface UpdateOptions {
  skipChangeState?: boolean;
  throttle?: number;
}

cyango.storyState.updateStoryData(updates: UpdateTarget[], options?: UpdateOptions): void
```

Use arrays for `sceneIds` and `entityIds`, even for one item.

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

Options:

| Option | Use |
|--------|-----|
| `skipChangeState` | Avoid triggering story change tracking. Useful for high-frequency runtime updates. |
| `throttle` | Throttle frequent changes, such as transform/control updates. |

Related methods:

| Method | Signature | Notes |
|--------|-----------|-------|
| `setStoryProperties` | `(properties: Partial<IStory>) => void` | Type-defined. |
| `addNewAssetsToActiveStory` | `(assets: IAsset[], options?: { skipChangeState?: boolean }) => void` | Runtime-confirmed. Adds assets to active story. |
| `addAssetsToSceneManifest` | runtime method | Runtime-confirmed but not in Monaco definition. Use only when you know the expected payload from existing code. |
| `setActiveSceneAssets` | `() => Promise<void>` | Runtime-confirmed. Recomputes current scene assets. |
| `addLoadedAsset` | `(assetDomElementId: string, ready: boolean) => void` | Type-defined. |

### Prefabs

| Method | Signature | Notes |
|--------|-----------|-------|
| `instantiatePrefab` | `(params: InstantiatePrefabParams) => InstantiatePrefabResult | null` | Runtime-confirmed. Pastes an inline prefab snapshot from `activeStoryJson.prefabs`. Returns `null` if no snapshot exists. |

`cyango.storyState.instantiatePrefab` and `cyango.utils.instantiatePrefab` point to the same runtime capability.

Important: if a prefab is referenced only from custom code, make sure it is bundled in `settings.options.customCodePrefabIds`; otherwise `activeStoryJson.prefabs` may not contain the snapshot in playback/export.

### XR, AR, webcam, camera, map

| Method | Signature | Notes |
|--------|-----------|-------|
| `setStoryQualityLevel` | `(level: StoryQualityLevel) => void` | Runtime-confirmed. `StoryQualityLevel` numeric enum: `LOW=0`, `MEDIUM=1`, `HIGH=2`, `ULTRA=3`. |
| `setTeleportTargetPosition` | `(position: Vector3) => void` | Type-defined. |
| `setisWebcamReady` | `(ready: boolean) => void` | Runtime-confirmed. Note lowercase `i` in `setis...`. |
| `setFaceMeshScale` | `(scale: [number, number]) => void` | Runtime-confirmed. |
| `setXRStore` | `(store: XRStore) => void` | Type-defined. |
| `enterAR` | `() => Promise<void>` | Runtime-confirmed. |
| `enterVR` | `() => Promise<void>` | Runtime-confirmed. |
| `exitXR` | `() => Promise<void>` | Runtime-confirmed. |
| `onHitTestResults` | `(handedness: XRHandedness, results: XRHitTestResult[], getWorldMatrix: GetWorldMatrixFromXRHitTest) => void` | Type-defined. |
| `setIsAROriginSet` | `(state: { isReadyToSetAROrigin?: boolean; isAROriginSet?: boolean }) => void` | Runtime-confirmed. |
| `setCameraAction` | `(action: IAction) => void` | Type-defined. |
| `setIsAR` | `(bool: boolean) => void` | Runtime-confirmed. |
| `setIsVR` | `(bool: boolean) => void` | Runtime-confirmed. |
| `setIsMobileAR` | `(bool: boolean) => void` | Runtime-confirmed. |
| `recenterMap` | `(latitude: number, longitude: number) => void` | Runtime-confirmed. Recenters the active map. |

## `cyango.uiState`

Use UI state for loading flags, camera control state, system modals, external URLs, subtitles, and breakpoint awareness.

### Runtime-confirmed readable state

| Property | Type / shape | Notes |
|----------|--------------|-------|
| `isAppLoading` | `boolean` | Loading flag. |
| `userHasInteracted` | runtime boolean | Runtime-confirmed but not in Monaco definition. |
| `cameraControlsEnabled` | `boolean` | Orbit/camera controls enabled. |
| `selectedBreakpoint` | `BreakpointStateTypes` | Current breakpoint. |
| `isSceneControlsMoving` | `boolean` | Scene controls movement state. |

### Type-defined readable state

| Property | Type / shape | Notes |
|----------|--------------|-------|
| `currentSystemModalType` | `SystemModalType` | Current modal. Values below. |
| `externalUrl` | `string | null` | URL for external URL modal. |
| `needsUserInteraction` | `boolean` | Whether user interaction is needed. |
| `isAppOnline` | `boolean` | Online state. |
| `showSubtitles` | `boolean` | Subtitle visibility. |
| `modal` | `IModal | null` | Modal payload. |
| `pwaInstallPrompt` | `any | null` | PWA install prompt. Android/Chrome only. |
| `isPWAInstalled` | `boolean` | Whether installed as PWA. |

### `SystemModalType`

| Value | Meaning |
|-------|---------|
| `none` | No modal. |
| `share` | Share modal. |
| `quality` | Quality modal. |
| `entity` | Entity modal. |
| `assets_converting` | Assets converting modal. |
| `external_url` | External URL modal. |
| `user_interact` | User interaction modal. |
| `pwa_install` | PWA install modal. |

### Methods

| Method | Signature | Notes |
|--------|-----------|-------|
| `setIsAppLoading` | `(bool: boolean) => void` | Runtime-confirmed. |
| `openSystemModal` | `(type: SystemModalType, options?: { modal?: IModal | null; externalUrl?: string; needsUserInteraction?: boolean }) => void` | Runtime-confirmed. |
| `closeSystemModal` | `() => void` | Runtime-confirmed. |
| `setCameraControlsEnabled` | `(bool: boolean) => void` | Runtime-confirmed. |
| `openUrl` | `(url: string) => Promise<void>` | Runtime-confirmed. Preferred way to open external URLs from custom code. |
| `setIsAppOnline` | `(bool: boolean) => void` | Type-defined. |
| `setSelectedBreakpoint` | `(breakpoint: BreakpointStateTypes) => void` | Runtime-confirmed. |
| `setIsSceneControlsMoving` | `(bool: boolean) => void` | Runtime-confirmed. |
| `toggleSubtitles` | `() => void` | Type-defined. |

Example:

```js
await cyango.uiState.openUrl('https://example.com');
```

## `cyango.timelineState`

Use timeline state for global timeline playback and elapsed time.

### Readable state

| Property | Type / shape | Notes |
|----------|--------------|-------|
| `playingMode` | `PlayingModes` | Runtime-confirmed. Current timeline mode. |
| `isTimelineMuted` | `boolean` | Runtime-confirmed. |
| `elapsedTime` | `number` | Runtime-confirmed. Milliseconds. |
| `timelineInstance` | `gsap.core.Timeline | undefined` | Type-defined only. Do not manipulate unless necessary. |

### Methods

| Method | Signature | Notes |
|--------|-----------|-------|
| `controlMedia` | `('play' | 'pause' | 'seek' | 'stop' | 'mute' | 'unmute') => void` | Runtime-confirmed. Controls timeline/media. |
| `setPlayingMode` | `(mode: PlayingModes, muted?: 'muted' | 'unmuted') => void` | Runtime-confirmed. |
| `setTimelineMuteState` | `(bool: boolean) => void` | Runtime-confirmed. |
| `setElapsedTime` | `(timeInMs: number) => void` | Runtime-confirmed. |
| `setTimelineInstance` | `(timeline: gsap.core.Timeline) => void` | Type-defined. |
| `addAnimationToTimeline` | `(animation: gsap.core.Animation) => void` | Type-defined. |
| `removeAnimationFromTimeline` | `(animation: gsap.core.Animation) => void` | Type-defined. |

Example:

```js
cyango.timelineState.controlMedia('pause');
cyango.timelineState.setElapsedTime(5000);
```

## `cyango.utils`

Use utilities for entity lookup, runtime object lookup, active scene lookup, global custom-code variables, device/browser detection, prefab instantiation, and GUI scroll control.

### Entity and scene lookup

| Method/property | Signature | Notes |
|-----------------|-----------|-------|
| `getEntityById` | `(entities: IEntity[], objectUserDataEntityId: string) => IEntity | null` | Runtime-confirmed. Search an entity array by id. |
| `getEntityByName` | `(entities: IEntity[], entityName: string) => IEntity | null` | Runtime-confirmed. Search by name. |
| `getObjectByEntityId` | `(objectContainer?: any, entityId?: string) => Object3D<Object3DEventMap> | undefined` | Runtime-confirmed. Find mounted Three object by entity id. Advanced use. |
| `getActiveScene` | `() => IScene | null` | Runtime-confirmed. Finds active scene from `activeStoryJson.scenes` and `activeSceneId`. |
| `findAllAssetsInEntities` | `(entities: IEntity[], storyAssets: IAsset[]) => IAsset[]` | Runtime-confirmed. |
| `processPasteEntities` | `(params: { selectedEntities: IEntity[]; assets: IAsset[]; entityTransformReference?: EntityTransform; activeScene: IScene }) => { processedEntities: IEntity[]; processedAssets: IAsset[] }` | Runtime-confirmed in definitions. Runtime type annotation says `void`, implementation import returns processed data. Use only when duplicating/pasting entity payloads. |
| `thisEntity` | `IEntity | null` | Runtime-confirmed. Entity whose action is running, or `null` for scene-level actions. Prefer this over hard-coding the triggering entity when writing reusable entity actions. |

Example:

```js
const scene = cyango.utils.getActiveScene();
const button = scene ? cyango.utils.getEntityByName(scene.entities, 'Next Button') : null;
```

### Global variables

These variables persist in the story runtime store for custom code. They are good for counters, flags, and small cross-action state. Do not use them as durable saved story data.

| Method/property | Signature | Notes |
|-----------------|-----------|-------|
| `globalVars` | `Record<string, any>` | Runtime-confirmed. Current variable bag. |
| `setGlobalVar` | `(key: string, value: any) => void` | Runtime-confirmed. |
| `getGlobalVar` | `(key: string) => any` | Runtime-confirmed. |
| `clearGlobalVars` | `() => void` | Runtime-confirmed. |
| `deleteGlobalVar` | `(key: string) => boolean` | Runtime-confirmed. |

Example:

```js
const count = (cyango.utils.getGlobalVar('clickCount') ?? 0) + 1;
cyango.utils.setGlobalVar('clickCount', count);
console.log('click count', count);
```

### Browser/device helpers

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

Use `cyango.utils` helpers instead of blocked globals:

- Use `cyango.utils.getNavigator()` instead of `navigator`.
- Use `cyango.utils.getWindowLocation()` instead of `location`.
- There is no direct `document` replacement. If the task needs DOM manipulation, explain that this sandbox is not intended for direct DOM access.

Current runtime does not shadow `fetch` or `localStorage`, but do not rely on them unless the user explicitly needs that behavior; prefer Cyango state/actions/helpers for story interactions.

| Method | Signature | Notes |
|--------|-----------|-------|
| `getWindowLocation` | `() => Location` | Runtime-confirmed. Returns `window.location`. |
| `getNavigator` | `() => Navigator` | Runtime-confirmed. Returns `window.navigator`. |
| `detectDeviceType` | `() => 'iPad' | 'iPhone' | 'Android' | 'Windows' | 'Mac' | 'Unknown'` | Runtime-confirmed. |
| `detectBrowser` | `() => 'Unknown' | 'Oculus Browser' | 'Mozilla Firefox' | 'Google Chrome' | 'Apple Safari' | 'Opera' | 'Microsoft Edge' | 'Internet Explorer'` | Runtime-confirmed. |
| `convertLatLngToSpherical` | `(latitude: number, longitude: number) => Vector3` | Runtime-confirmed. Useful for map/panorama coordinate work. |

### Prefabs

| Method | Signature | Notes |
|--------|-----------|-------|
| `instantiatePrefab` | `(params: InstantiatePrefabParams) => InstantiatePrefabResult | null` | Runtime-confirmed. Same capability as `storyState.instantiatePrefab`. |

Typical params include the prefab id, target scene, optional parent, and optional transform. Check `@cyango/cyango-shared` types if exact params matter.

```js
const result = cyango.utils.instantiatePrefab({
  prefabId: 'prefab-id',
  sceneId: cyango.storyState.activeSceneId
});

if (!result) {
  console.warn('Prefab snapshot not found');
}
```

### GUI scroll helpers

These target story-player GUI containers with scrollable UIKit content. Entity ids should be GUI container entity ids.

| Method | Signature | Notes |
|--------|-----------|-------|
| `getGuiScrollPosition` | `(entityId: string) => { x: number; y: number } | null` | Last known scroll offset. Call `trackGuiScroll` first to record user scrolls. |
| `getGuiMaxScrollPosition` | `(entityId: string) => { x: number; y: number } | null` | Max scroll offset: content size minus viewport. |
| `setGuiScrollPosition` | `(entityId: string, x: number, y: number) => boolean` | Applies scroll immediately and schedules a follow-up after layout. |
| `restoreGuiScrollPosition` | `(entityId: string, x: number, y: number, timeoutMs?: number) => Promise<boolean>` | Waits until layout allows target Y, then applies. Use after list mutations. |
| `restoreGuiScrollPositionAfterGrowth` | `(entityId: string, x: number, y: number, previousMaxY: number, timeoutMs?: number) => Promise<boolean>` | After prepending/growing content: target Y = previousY + (newMaxY - previousMaxY). |
| `scrollGuiBy` | `(entityId: string, deltaX: number, deltaY: number) => boolean` | Offset from last known position. |
| `trackGuiScroll` | `(entityId: string) => void` | Opt in to scroll tracking. |
| `untrackGuiScroll` | `(entityId: string) => void` | Opt out. |
| `lockGuiScroll` | `(entityId: string) => void` | Blocks user scroll/pointer until unlocked. |
| `unlockGuiScroll` | `(entityId: string) => void` | Re-enables user scroll. |
| `isGuiScrollLocked` | `(entityId: string) => boolean` | Check lock state. |

Example:

```js
const listId = 'gui-list-container-id';
cyango.utils.trackGuiScroll(listId);

const before = cyango.utils.getGuiScrollPosition(listId);
const beforeMax = cyango.utils.getGuiMaxScrollPosition(listId);

// mutate list data here...

if (before && beforeMax) {
  await cyango.utils.restoreGuiScrollPositionAfterGrowth(listId, before.x, before.y, beforeMax.y);
}
```

## Shared Cyango types in Monaco

Monaco also exposes selected `@cyango/cyango-shared` types so code authors and agents can reason about payload shapes. Common useful names include:

| Type / enum | Use |
|-------------|-----|
| `IAsset`, `IAssetSource`, `AssetMimeTypes`, `AssetCategories`, `AssetFileTypes` | Assets and asset filtering. |
| `IEntity`, `EntityTypes`, `IEntityGeometry`, `GeometryPrimitive`, `IEntityMaterial`, `MaterialTypes`, `IEntityComponent` | Entity modeling and updates. |
| `IScene`, `SceneTypes` | Scene modeling. |
| `IVisibility` | Visibility property shape. |
| `IAction`, `ActionType`, `EventType` | Action construction and triggering. |
| `IStory`, `IStoryJson`, `IStorySettings`, `IStoryPrivacy`, `StoryPrivacyTypes`, `ThemeTypes` | Story-level data. |
| `IAnimation`, `IKeyframe` | Timeline/keyframe data. |
| `ICustomCode` | `customCode: { code, errorMessages? }` shape. |
| `IGUIProperties`, `IEntityGUI` | GUI property shapes. |
| `LanguageTypes`, `LocalizationObject` | Localization. |

For entity, scene, action, timeline, and GUI payloads, prefer the dedicated MCP reference files in this skill over reconstructing shapes from memory.

