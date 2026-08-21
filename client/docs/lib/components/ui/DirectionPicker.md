# `lib/components/ui/DirectionPicker.tsx`

[← lib/components/ui](README.md)

## Purpose

Two-button toggle for picking a timer's count `"up"`/`"down"` direction.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `DirectionPicker` | `(props: DirectionPickerProps): JSX` | Renders two side-by-side toggle buttons (down/up); the one matching `value` is highlighted in the accent color. |

### `DirectionPickerProps`

| Property | Type | Meaning |
|---|---|---|
| `value` | `"up" \| "down"` | Currently selected direction; controls which button is styled as selected. |
| `onChange` | `(v: "up" \| "down") => void` | Called with `"down"` or `"up"` when the respective button is pressed. |
| `labelDown` | `string` | Text label for the down button. |
| `labelUp` | `string` | Text label for the up button. |

## Used by

- [`lib/components/timer/TimerDurationFields.tsx`](../timer/TimerDurationFields.md)
