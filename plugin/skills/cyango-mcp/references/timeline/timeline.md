# Timeline and animation

The scene timeline schedules playback: language-specific duration, layered tracks, and keyed values. Most entity fields that change over time are wrapped in `IAnimation<T>`, a current value plus optional keyframes on the same clock.

Runtime control (play/pause/mute) uses timeline `ActionType` values (`PLAY_TIMELINE`, `PAUSE_TIMELINE`, `STOP_TIMELINE`, `MUTE_TIMELINE`, `UNMUTE_TIMELINE`).

Field shapes for `ITimeline`, `ITimelineDuration`, `IAnimation<T>`, `IKeyframe<T>` and `IMediaClip` are in [cyango-shared-types.md](../cyango-shared-types.md). This page covers how they fit together.

---

## Where it lives

| Location | What |
|----------|------|
| **Scene** | `timeline?: ITimeline`, id, name, per-language durations. |
| **Entity** | Many props are `IAnimation<…>` (position, rotation, scale, material, media, gui, actions). Each has a value and optional keyframes. |

A duration of `0` means indefinite: the scene runs until the viewer interacts, which is what a static panorama wants.

---

## `animations` clips vs keyframes

`animations?: IAnimation<IEntityAnimation[]>` is a different thing from keyframes: it holds **clips** that a self-animating entity plays, and the master timeline drives them.

| Type | What a clip means |
|------|-------------------|
| `CUSTOM_3D_MODEL` | A named glTF animation clip (skeletal / node). |
| `SPRITE` | A frame range in the spritesheet grid (`startFrame`, `endFrame`, `fps`). |
| `LOTTIE` | A frame range of the Bodymovin document (same fields as `SPRITE`). |

All three are created with one looping `"Main"` clip. Patch `animations.currentValue` with the **full clip array**; it is replaced, not merged. Details in [animated-common.md](../entities/animated/animated-common.md).

---

## Quick mental model

1. Scene `timeline` sets **how long** the beat is per language.
2. Entity `IAnimation<…>` tracks define **what** changes over that clock.
3. `excludeFromMasterTimeline` isolates a track until something triggers it.
4. Timeline actions (`PLAY_TIMELINE`, …) drive the master clock.
