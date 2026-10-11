# GUI: desktop-first execution

Every GUI value lives in a **slot**: `gui.currentValue.<breakpoint>.<state>.<prop>`, for example `desktop.default.width` or `desktop.hover.backgroundColor`. The runtime only ever reads from a slot, so a bare `gui.currentValue.<prop>` writes data that nothing renders.

**Fill `desktop.default` first, always.** Then decide whether the task needs the other breakpoints:

- **UI design requests** (menus, dashboards, onboarding flows, forms, landing screens, similar layout work) are **responsive by default**. Once desktop is solid, add `tablet` and `mobile` slots for the properties that should differ: widths, padding, font sizes, flex direction, gaps.
- **Non-design GUI edits** (bug fixes, single-property tweaks, copy changes) need `desktop` alone, unless the user asks for breakpoints.

## The cascade

Each breakpoint is an **independent, override-only slot**. Writing `desktop` does not populate `tablet` or `mobile`, and the same holds in every direction. At render time the runtime resolves each property individually by looking upward:

- **mobile**: mobile → tablet → desktop
- **tablet**: tablet → desktop
- **desktop**: desktop only

The lookup is per-property and read-time only, so a slot needs only the properties that genuinely differ from the one above it. Setting `desktop` alone is safe and intentional: the layout renders identically on all three until an override exists.

**Example, a button with partial overrides:**

| Breakpoint | Stored data | Rendered result |
|---|---|---|
| `desktop` | `width: 400`, `height: 56`, `backgroundColor: "#2563eb"` | `width: 400`, `height: 56`, `backgroundColor: "#2563eb"` |
| `tablet` | `width: 320` only | `width: 320` (own), `height: 56` (← desktop), `backgroundColor: "#2563eb"` (← desktop) |
| `mobile` | `width: 280`, `backgroundColor: "#7c3aed"` only | `width: 280` (own), `height: 56` (← tablet has none → desktop), `backgroundColor: "#7c3aed"` (own, overrides both) |

**The tablet-only-change trap:** to make tablet narrower while mobile keeps the desktop width, leaving mobile empty is wrong. Mobile inherits the tablet `width: 320` instead. Set `mobile.default.width` explicitly to `400` to mirror desktop. No property can skip tablet and fall through to desktop.

## Execution order

1. **Fill the `desktop` slots**: sizes, flex, typography, colors, all layout.
2. **Confirm desktop** with `get_entity` if a layout issue needs debugging before overrides go on.
3. **Add `tablet` / `mobile` slots** when the task is a UI design, or the user asked for responsive variants.

Before moving to step 3, confirm on desktop that text does not clip (`lineHeight ≥ fontSize + ~4 px`) and that flex children are sized and ordered as intended. For each `tablet` override, decide whether `mobile` should inherit it (leave mobile empty) or match desktop instead (set mobile explicitly).

## At create time

In `overrides` on an `add_entities` row, put every initial value under `gui.currentValue.desktop.default`. Add `tablet` / `mobile` in a follow-up `update_entities` wave for UI designs, and omit them for non-design edits:

```json
{
  "gui": {
    "currentValue": {
      "desktop": {
        "default": {
          "width": 400,
          "flexDirection": "column",
          "gap": 12,
          "backgroundColor": "#1a1a1a",
          "backgroundOpacity": 0.9
        }
      }
    }
  }
}
```
