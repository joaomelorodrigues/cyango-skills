# Timeline and animation

The scene timeline is one clock in milliseconds. Entity properties change on that clock in two ways: **keys** (a value at a point in time) and **clips** (content that plays in a window of time).

Runtime control (play/pause/mute) uses timeline `ActionType` values (`PLAY_TIMELINE`, `PAUSE_TIMELINE`, `STOP_TIMELINE`, `MUTE_TIMELINE`, `UNMUTE_TIMELINE`).

Field shapes for `ITimeline`, `ITimelineDuration`, `IAnimation<T>`, `IKeyframe<T>` and `IMediaClip` are in [cyango-shared-types.md](../cyango-shared-types.md). This page covers how they fit together.

---

## Where it lives

| Location | What |
|----------|------|
| **Scene** | `timeline?: ITimeline` with per-language durations, and `hasCustomDuration`. |
| **Entity** | Each animated property is an `IAnimation<T>`: `currentValue` plus `keyframes`. |

`currentValue` is the static value. `keyframes` is the list of keys or clips of that property. The two track kinds never mix on one property.

| Kind | Properties | A keyframe is |
|------|------------|---------------|
| **Point track** | `position`, `rotation`, `scale`, `camera`, `light`, `material`, `gui`, `skybox`, `environment`, `codeParams`, `visibilityTrack` | A key: `{ id, startTime, value, ease }`. **No `endTime`.** |
| **Clip track** | `media`, `animations`, `splat`, `subtitles` | A clip: `{ id, startTime, endTime, value }`. |

`endTime` is the only thing that tells a key from a clip. Do not put `endTime` on a point track.

---

## Keys (point tracks)

A key says "this value at this time". The value moves from one key to the next key. Before the first key the property holds the first key value. After the last key it holds the last key value. So a property needs two keys to move.

```json
{
  "propertyPath": "position.keyframes",
  "value": [
    { "id": "layeritem_a1", "startTime": 0, "value": [0, 1, 0], "ease": "power1.inOut" },
    { "id": "layeritem_a2", "startTime": 2000, "value": [3, 1, 0], "ease": "power1.inOut" },
    { "id": "layeritem_a3", "startTime": 5000, "value": [3, 4, 0], "ease": "none" }
  ]
}
```

Rules:

- `startTime` is whole milliseconds, 0 or more. Use multiples of 10.
- One key for each time on a track. Two keys at the same `startTime` are an error.
- `id` is a unique string on each keyframe, for example `layeritem_` plus a UUID.
- Always write the **full array** to `<property>.keyframes`. A path inside the array is not supported.
- While a property has keys, the keys decide what the viewer sees. `currentValue` shows only when the property has no key.

### Ease

`ease` shapes the move that **arrives** at the key. The first key of a track has no move before it, so its ease does nothing. Set `ease` on every key. A key with no `ease` moves linear.

| `ease` | Result |
|--------|--------|
| `power1.inOut` | Ease in and out. The editor uses it for new keys. Use it when you have no reason for another. |
| `none` | Linear. |
| `power1.in` | Ease in. |
| `power1.out` | Ease out. |
| `steps(1)` | Hold. The value stays at the key before, then jumps at this key. |

### Key value for each track

| Track | Key value | Notes |
|-------|-----------|-------|
| `position`, `rotation`, `scale` | The whole vector `[x, y, z]` | Rotation is in radians, the same as `currentValue`. |
| `camera` | `{ position: {x,y,z}, orbitControlsTarget: {x,y,z}, fov? }` | Vectors are **objects**, not arrays. An array breaks the camera. Only on the `CAMERA` entity. |
| `light` | An object with only the fields that change | `lightColor`, `intensity`, `distance`, `decay`, `angle`, `penumbra`, `attenuation`, `anglePower`. |
| `material` | An object with only the fields that change | `color`, `emissive`, `emissiveIntensity`, `opacity`, `metalness`, `roughness`. |
| `gui` | A flat object with only the fields that change | `transformTranslateX/Y/Z`, `transformRotateX/Y/Z`, `transformScaleX/Y`, `backgroundOpacity`, `textOpacity`, `borderOpacity`, `scrollbarOpacity`, `backgroundColor`, `textColor`, `borderColor`. |
| `skybox` | An object with only the fields that change | `turbidity`, `rayleigh`, `inclination`, `azimuth`, `mieCoefficient`, `mieDirectionalG`. Only on the `SKYBOX` entity. |
| `environment` | An object with only the fields that change | `environmentIntensity`, `backgroundIntensity`, `backgroundBlurriness`, `environmentRotation`, `backgroundRotation`. A rotation is `[x, y, z]` in radians. Only on the `HDR` entity. |
| `codeParams` | An object with only the params that change | One field for each param key of the code block. Only on the `GUI_CUSTOM_CODE` entity. |
| `visibilityTrack` | An object with only the flags that change | Booleans only. `hiddenTotally` shows (`false`) or hides (`true`) the entity. Also `hiddenInDesktop`, `hiddenInTablet`, `hiddenInMobile`, `hiddenInAR`, `hiddenInMobileAR`, `hiddenInVR`, `hiddenInIPhone`, `hiddenInIPad`, `hiddenInAndroid`, `hiddenInPWAAndroid`, `hiddenInPWAiOS`. |

Per-field tracks (`light`, `material`, `gui`, `skybox`, `environment`, `codeParams`, `visibilityTrack`): each field has its own line of keys. A key lists only the fields that have a key at that time. A field with no key in any keyframe stays static and reads `currentValue`.

```json
{
  "propertyPath": "material.keyframes",
  "value": [
    { "id": "layeritem_m1", "startTime": 0, "value": { "opacity": 0 }, "ease": "power1.inOut" },
    { "id": "layeritem_m2", "startTime": 1000, "value": { "opacity": 1, "color": "#ffffff" }, "ease": "power1.out" },
    { "id": "layeritem_m3", "startTime": 3000, "value": { "color": "#ff3300" }, "ease": "power1.inOut" }
  ]
}
```

```json
{
  "propertyPath": "visibilityTrack.keyframes",
  "value": [
    { "id": "layeritem_v1", "startTime": 0, "value": { "hiddenTotally": true } },
    { "id": "layeritem_v2", "startTime": 2000, "value": { "hiddenTotally": false } },
    { "id": "layeritem_v3", "startTime": 6000, "value": { "hiddenTotally": true } }
  ]
}
```

More rules:

- **Opacity keys** on `material` show only when `material.currentValue.transparent` is `true`. Set it in the same wave.
- **`gui` keys are flat.** They have no breakpoint and no state: no `desktop`, no `default`. One line of keys applies on all breakpoints. Layout fields (size, padding, flex) cannot have keys.
- **Camera keys.** Two or more keys in a row make a shot, and the camera follows the shot. Outside a shot the viewer controls the camera. A key with `"ease": "steps(1)"` ends the shot before it: the camera is free until that key, then it cuts to the key.
- **Skybox keys** move the sun and change the haze: `inclination` is the height of the sun, `azimuth` is its direction. Use them for a change of the time of day.
- **HDR keys are at `environment.keyframes`, not in `hdr`.** The `hdr` object of an `HDR` entity holds the static values (`hdr.environmentIntensity`, ...) and has no keyframes. Write the keys to `environment.keyframes`. A field with no key reads `hdr`.
- **Code param keys are at `codeParams.keyframes`.** The stored values stay in `customCode.params`. A key value uses the param keys: `{ "speed": 5, "tint": "#00ff00" }`. A number, a color and a `[x, y, z]` vector move between keys. A boolean, a text and a select value hold, then change at their key.
- **Show and hide keys are at `visibilityTrack.keyframes`, not in `visibility`.** The `visibility` object holds the static flags and has no keyframes. A flag is a boolean, so it never moves between keys: it holds, then changes at its key. To show an entity from 2 s on, write a key at 0 with `{ "hiddenTotally": true }` and a key at 2000 with `{ "hiddenTotally": false }`. A hidden parent hides its children. Sound entities, the camera, the player, subtitles, the face mesh and image targets have no visibility keys.
- **A visibility key wins over the stored flag and over a show or hide action** while the flag has keys. The flags with no key (for example `hiddenInMobile`) still apply from `visibility`.
- **How a code block sees a keyed param.** The code of the block is not run again. A key gives the param a new value on each frame, and the block follows it where it reads the param: inside `effect(() => { ... })` (the effect runs again) or inside `update()` (the next frame reads it). A param that the code reads only at its top, outside both, does not follow its keys. See [custom-code.md](../custom-code.md).
- **A `GUI_CUSTOM_CODE` entity in the 3D scene** (no gui parent) is a group: it has `position`, `rotation` and `scale` keys, and no `gui` keys. Under a gui parent it has `gui` keys, and no transform keys.
- `text3D` has no keys.

---

## Clips (clip tracks)

A clip plays content in a window: from `startTime` to `endTime`. Clips of one track must not overlap. A clip does not use `ease`: set `"ease": "none"`.

### Media (`media`)

Video and audio have two modes:

| `media.keyframes` | Behavior |
|-------------------|----------|
| Empty or missing | The media follows the whole scene: it starts at 0, and it loops when `media.currentValue.loop` is `true`. |
| One or more clips | The media plays **only inside the clips**. Outside them it is paused. |

Do not write one clip from 0 to the full length with no trim. It is the same as no clip. Leave `keyframes` empty.

A media clip value is an `IMediaClip`. `from`, `to` and `speed` say which part of the file plays, in ms of the file:

```json
{
  "propertyPath": "media.keyframes",
  "value": [
    {
      "id": "layeritem_c1",
      "startTime": 1000,
      "endTime": 4000,
      "value": { "name": "intro.mp4", "duration": 12000, "from": 2000, "to": 5000, "speed": 1, "volume": 1 },
      "ease": "none"
    }
  ]
}
```

Keep `endTime - startTime` equal to `(to - from) / speed`. `volume`, `loop`, `controls`, `play`, `unmuted` and `speed` on the clip value apply while that clip plays.

### Animation clips (`animations`)

`animations?: IAnimation<IEntityAnimation[]>` holds the animations that a self-animating entity plays.

| Type | What an animation means |
|------|-------------------------|
| `CUSTOM_3D_MODEL` | A named glTF animation clip (skeletal / node). |
| `SPRITE` | A frame range in the spritesheet grid (`startFrame`, `endFrame`, `fps`). |
| `LOTTIE` | A frame range of the Bodymovin document (same fields as `SPRITE`). |

All three are created with one looping `"Main"` animation in `animations.currentValue`. Patch `animations.currentValue` with the **full array**; it is replaced, not merged. Details in [animated-common.md](../entities/animated/animated-common.md).

With no keyframes, the animations follow their `play` flags for the whole scene. To play an animation only in a window, add a clip to `animations.keyframes`. The clip value is an array with **one** `IEntityAnimation`: the same source fields (`name`, or `startFrame` / `endFrame` / `fps`) plus `from`, `to` and `speed` in ms of the animation.

### Splat effects (`splat`)

A clip value is `{ "effects": { "type", "intensity", "from"?, "to"?, "speed"? } }`. The effect runs on its own clock inside the clip. With no clip, `splat.currentValue.effects` applies for the whole scene.

### Subtitles (`subtitles`)

A cue is a clip with the value `{ "text": "..." }`. It has no trim fields.

---

## Scene duration

`timeline.durations` holds one `{ language, duration }` for each language, in ms. It applies only when the scene has `hasCustomDuration: true`.

- With a custom duration, the scene ends there. Keys and clips after the end do not play.
- With no custom duration, the scene ends at the end of its content: the last key, the last clip end, or one pass of a media with no clip. The minimum is 10 s.
- A duration of `0` means indefinite: the scene runs until the viewer interacts, which is what a static panorama wants.

Keys are the same for all languages. Only the duration is per language.

---

## Before you write keyframes

1. Run `validate_patch` on every `<property>.keyframes` patch. It checks the rules on this page.
2. Read the entity first (`get_entity`) and keep the keyframes you do not change: the array is replaced, not merged.
3. Put all keyframe patches of one change in one `update_entities` wave.

## Quick mental model

1. Scene `timeline` sets **how long** the scene is, per language.
2. Point tracks hold **keys**: a value at a time, no `endTime`.
3. Clip tracks hold **clips**: content in a window, with `endTime`.
4. `excludeFromMasterTimeline` isolates a track until an action triggers it.
5. Timeline actions (`PLAY_TIMELINE`, …) drive the master clock.
