# GUI: desktop-first execution

When building or editing GUI layouts, **always complete the `desktop` breakpoint first**.

**Assume responsive for UI design requests** — menus, dashboards, onboarding flows, forms, landing screens, and similar layout work. After desktop is solid, add `tablet` and `mobile` overrides for properties that should differ (widths, padding, font sizes, flex direction, gaps).

For **non-design GUI edits** (bug fixes, single-property tweaks, copy changes), `desktop` alone is sufficient unless the user asks for breakpoints or says the work should be responsive.

## Why

Each breakpoint is an **independent override-only slot** at the data/MCP level. Setting a property on `desktop` does **not** automatically write it to `tablet` or `mobile` — those slots stay absent or empty (`{}`) until you write to them explicitly. The same is true in every direction: writing to `tablet` does not touch `mobile`; writing to `mobile` does not touch `tablet` or `desktop`.

At **render/runtime**, the editor uses a cascade to resolve each GUI property individually. When a breakpoint slot has no value for a property, it looks upward to the next breakpoint:

- **mobile**: checks mobile → tablet → desktop
- **tablet**: checks tablet → desktop
- **desktop**: desktop only

This is per-property and read-time only — no write-through occurs. Setting `desktop` alone is safe and intentional; the layout will render identically on all breakpoints until explicit overrides are added.

Setting all three breakpoints at once before verifying desktop adds noise and makes debugging harder.

## Breakpoint cascade chain

Because the cascade is per-property, a breakpoint slot only needs to contain the properties that genuinely differ from the one above it. All other properties resolve upward automatically.

**Example — button with partial overrides:**

| Breakpoint | Stored data | Rendered result |
|---|---|---|
| `desktop` | `width: 400`, `height: 56`, `backgroundColor: "#2563eb"` | `width: 400`, `height: 56`, `backgroundColor: "#2563eb"` |
| `tablet` | `width: 320` only | `width: 320` (own), `height: 56` (← desktop), `backgroundColor: "#2563eb"` (← desktop) |
| `mobile` | `width: 280`, `backgroundColor: "#7c3aed"` only | `width: 280` (own), `height: 56` (← tablet has none → desktop), `backgroundColor: "#7c3aed"` (own — overrides both tablet and desktop) |

**The tablet-only-change trap:** If you want tablet to be narrower but mobile to stay at the desktop width, leaving mobile empty is wrong — mobile will silently inherit the tablet `width: 320`. To prevent this, `mobile.default.width` must be explicitly set to `400` to mirror the desktop value. There is no way to "skip" tablet and fall through to desktop directly for a specific property.

## Execution order

1. **Set `desktop` properties** — sizes, flex, typography, colors, all layout.
2. **Optionally confirm `desktop` layout** with `get_entity` if debugging a layout issue before adding responsive overrides.
3. **Add `tablet` / `mobile` overrides** when the task is a UI design (default) or the user explicitly requires responsive variants.

## Property paths

Always qualify GUI property paths with the breakpoint + state:

```
gui.currentValue.desktop.default.<property>
gui.currentValue.desktop.hover.<property>
```

Do **not** write bare `gui.currentValue.<property>` — the runtime always reads from a specific `breakpoint.state` slot.

## At create time

When passing `overrides` on **`add_entities`** rows, place all initial values under `gui.currentValue.desktop.default`. Add `tablet` / `mobile` in follow-up `update_entities` batches for UI designs; omit them for non-design edits — the cascade handles the rest:

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

## Checklist before adding `tablet` / `mobile`

- [ ] Text does not clip (`lineHeight ≥ fontSize + ~4 px` on desktop).
- [ ] Flex children are sized and ordered as intended.
- [ ] Task is a UI design (add overrides) or the user explicitly requested responsive — if neither, stop here.
- [ ] For each `tablet` override added: decide whether `mobile` should inherit it (leave mobile empty) or match desktop instead (set mobile explicitly to the desktop value).
