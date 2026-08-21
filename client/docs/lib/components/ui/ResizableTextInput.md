# `lib/components/ui/ResizableTextInput.tsx`

[← lib/components/ui](README.md)

## Purpose

Multiline `TextInput` with a drag handle in the corner to resize its height.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `ResizableTextInput` | `(props: ResizableTextInputProps): JSX` | Multiline `TextInput` plus a drag handle (bottom-right) wired to a `PanResponder` that adjusts the input's height. |

### `ResizableTextInputProps`

| Property | Type | Meaning |
|---|---|---|
| `value` | `string` | Current text value (controlled input). |
| `onChangeText` | `(v: string) => void` | Called with the new text on every keystroke. |
| `placeholder` | `string?` | Placeholder text shown when empty. |
| `style` | `TextStyle?` | Extra style merged onto the `TextInput`. |
| `resetOn` | `boolean` | Resets the height back to `MIN_HEIGHT` (96) whenever it becomes `true` (typically a modal's `visible` prop, so the field starts fresh each time the modal reopens). |

## How it works

Uses a `PanResponder` on the drag handle: `onPanResponderGrant` captures
the height at drag start, `onPanResponderMove` adds the vertical drag delta
(`gesture.dy`) to it, clamped to never go below `MIN_HEIGHT`.

### Height state: `height` (render) vs `heightRef` (gesture)

The component tracks height in two places at once: `height` state (drives
the actual rendered `TextInput` height) and `heightRef`/`startHeightRef`
refs. The `PanResponder` callbacks read/write the refs instead of state
directly because `PanResponder`'s handlers are created once (inside
`useRef(...).current`, so they never get recreated) and close over stale
values if they relied on state from the render that created them;
`heightRef.current` is always up to date regardless of render timing, and
`setHeight` is called alongside it purely to trigger the re-render that
actually resizes the `TextInput`. `onMoveShouldSetPanResponder` requires
`Math.abs(gesture.dy) > 2` before claiming the gesture, so small
jitters/taps on the handle don't get mistaken for a resize drag.

The `resetOn` effect writes to both `heightRef.current` and `height` state
directly (not through the pan responder) since it's an external reset
unrelated to any in-progress gesture.

## Used by

- [`lib/components/rules/RuleModal.tsx`](../rules/RuleModal.md)
- [`lib/components/schedule/ScheduleItemModal.tsx`](../schedule/ScheduleItemModal.md)
