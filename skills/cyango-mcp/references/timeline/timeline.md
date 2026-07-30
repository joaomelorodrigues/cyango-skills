# Timeline and animation

The scene timeline schedules playback: language-specific duration, layered tracks, and keyed values. Most entity fields that change over time are wrapped in `IAnimation<T>` — a current value plus optional keyframes on the same clock.

Runtime control (play/pause/mute) uses timeline `ActionType` values (`PLAY_TIMELINE`, `PAUSE_TIMELINE`, `STOP_TIMELINE`, `MUTE_TIMELINE`, `UNMUTE_TIMELINE`).

---

## Where it lives

| Location | What |
|----------|------|
| **Scene** | `timeline?: ITimeline` — id, name, per-language durations. |
| **Entity** | Many props are `IAnimation<…>` (position, rotation, scale, material, media, gui, actions). Each has a value and optional keyframes. |

---

## `ITimeline`

| Field | Notes |
|-------|-------|
| `id` | Timeline id. |
| `name` | Display name. |
| `durations` | `ITimelineDuration[]` — one per language. |

### `ITimelineDuration`

| Field | Notes |
|-------|-------|
| `language` | Which language this row applies to. |
| `duration` | Length in ms, or `0` for indefinite / interaction-driven. |

---

## `IAnimation<T>`

| Field | Notes |
|-------|-------|
| `id` | Track id. |
| `currentValue` | `T` — value at base state (also used when there are no keyframes). |
| `keyframes` | `IKeyframe<T>[]` — segments keyed to the scene timeline (ms). |
| `repeat` | How many times the track repeats; `-1` = infinite. |
| `excludeFromMasterTimeline` | If true, this track does not run with the master timeline — only when driven (e.g. by an action). |

---

## `IKeyframe<T>`

| Field | Notes |
|-------|-------|
| `id` | Keyframe id. |
| `startTime` / `endTime` | Ms on the scene timeline. |
| `value` | `T` at this segment. |
| `ease` | GSAP ease name. |
| `connected` | Whether this segment interpolates with neighbors. |

---

## `IMediaClip`

Used inside `IAnimation<IMediaClip>` (entity `media`).

| Field | Notes |
|-------|-------|
| `name` | Clip label. |
| `duration` | End ms relative to the timeline. |
| `originalAssetId` | Uploaded asset reference. |
| `speed` | Playback speed. |
| `volume` | 0–1. |
| `loop` / `controls` | Playback flags. |
| `play` / `unmuted` | Initial play / mute state. |
| `commandType` / `from` / `to` | Backend trim — start/end ms in source file. |

---

## `animations` clips vs keyframes

`animations?: IAnimation<IEntityAnimation[]>` is a different thing from keyframes: it holds **clips** that a self-animating entity plays, and the master timeline drives them.

| Type | What a clip means |
|------|-------------------|
| `CUSTOM_3D_MODEL` | A named glTF animation clip (skeletal / node). |
| `SPRITE` | A frame range in the spritesheet grid (`startFrame`, `endFrame`, `fps`). |
| `LOTTIE` | A frame range of the Bodymovin document (same fields as `SPRITE`). |

All three are created with one looping `"Main"` clip. Patch `animations.currentValue` with the **full clip array** — it is replaced, not merged. Details in [animated-common.md](../entities/animated/animated-common.md).

---

## Quick mental model

1. Scene `timeline` sets **how long** the beat is per language.
2. Entity `IAnimation<…>` tracks define **what** changes over that clock.
3. `excludeFromMasterTimeline` isolates a track until something triggers it.
4. Timeline actions (`PLAY_TIMELINE`, …) drive the master clock.
