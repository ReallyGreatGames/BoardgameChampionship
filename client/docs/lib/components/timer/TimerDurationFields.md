# `lib/components/timer/TimerDurationFields.tsx`

[← lib/components/timer](README.md)

## Purpose

Shared duration/round-time/direction form fields (JSX only — see
[`useDurationRoundFields`](../../hooks/useDurationRoundFields.md) for the
paired state/validation hook), used by both the per-table custom timer
override ([`CustomTimerModal`](CustomTimerModal.md)) and the per-game
default timer settings
([`TimerSettingsModal`](../schedule/TimerSettingsModal.md)) so the two
forms can't visually drift apart.

## Exports

### `TimerDurationFields(props: Props): JSX.Element`

Pure-presentation form: three [`FormField`](../ui/FormField.md)-wrapped
inputs (duration, round seconds, direction) with no internal state — every
value and change handler is passed in and forwarded to the underlying
`TextInput`/[`DirectionPicker`](../ui/DirectionPicker.md).

| Prop | Type | Meaning |
| --- | --- | --- |
| `duration` | `string` | Current text-field value for per-player duration (unit is caller-defined — minutes in both current callers). |
| `onDurationChange` | `(v: string) => void` | Fired on every keystroke in the duration field. |
| `onDurationBlur?` | `() => void` | Fired when the duration field loses focus; used by callers to trigger validation/normalization. |
| `durationLabel` | `string` | Label text above the duration field. |
| `durationPlaceholder` | `string` | Placeholder text shown when the duration field is empty. |
| `durationInvalid` | `boolean` | Applies the error style (`styles.inputError`) to the duration field. |
| `roundSeconds` | `string` | Current text-field value for the round-time budget in seconds. |
| `onRoundSecondsChange` | `(v: string) => void` | Fired on every keystroke in the round-seconds field. |
| `roundSecondsLabel` | `string` | Label text above the round-seconds field. |
| `roundSecondsPlaceholder` | `string` | Placeholder text shown when the round-seconds field is empty. |
| `roundSecondsInvalid` | `boolean` | Applies the error style to the round-seconds field. |
| `direction` | `"up" \| "down"` | Currently selected count direction. |
| `onDirectionChange` | `(v: "up" \| "down") => void` | Fired when the direction picker's selection changes. |
| `directionLabel` | `string` | Label text above the direction picker. |
| `directionDownLabel` | `string` | Label shown for the "down" option. |
| `directionUpLabel` | `string` | Label shown for the "up" option. |

## Used by

- [`lib/components/schedule/TimerSettingsModal.tsx`](../schedule/TimerSettingsModal.md)
- [`lib/components/timer/CustomTimerModal.tsx`](CustomTimerModal.md)
