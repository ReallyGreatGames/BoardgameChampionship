# `lib/components/timer/CustomTimerModal.tsx`

[← lib/components/timer](README.md)

## Purpose

Modal for setting a per-table timer override (duration/round-time/direction),
distinct from the game's default settings.

## Exports

### `CustomTimerModal(props: Props): JSX.Element`

Bottom-sheet modal that lets a table override the game's default timer with
its own duration, round-time budget, and count direction.

| Prop | Type | Meaning |
| --- | --- | --- |
| `visible` | `boolean` | Whether the sheet is shown; also gates the field-reset effect (see below). |
| `onClose` | `() => void` | Dismisses the modal without saving. |
| `initialDuration?` | `number` | Existing override's total duration in stored units (per-player minutes × 4); used to prefill the form. |
| `initialDirection?` | `"up" \| "down"` | Existing override's count direction, used to prefill the direction picker. |
| `initialRoundSeconds?` | `number` | Existing override's round-time budget in seconds, used to prefill that field. |
| `onSave` | `(duration: number, direction: "up" \| "down", roundSeconds: number) => Promise<void>` | Persists the new override; `duration` is passed back in the same stored total-minutes units as `initialDuration` (per-player minutes × 4), not the raw field value. |

### `handleSave(): Promise<void>`

Internal submit handler wired to the sheet's footer button. No-ops if the
form is invalid or a save is already in flight (`!isValid || saving`).
Otherwise sets `saving` true, converts the per-player-minutes field value
back to stored total minutes (`durNum * 4`), awaits `onSave(...)`, closes
the modal on success, and always clears `saving` in a `finally` block so a
rejected save leaves the sheet open and usable again.

## How it works

Built on [`useDurationRoundFields`](../../hooks/useDurationRoundFields.md)
for field state/validation, and
[`TimerDurationFields`](TimerDurationFields.md) for the shared JSX.

`initialDuration` is converted from the stored total-minutes value to
per-player minutes for display (`Math.round(initialDuration / 4)`) when the
modal opens, and `handleSave` converts back (`durNum * 4`) before calling
`onSave` — the form always works in per-player minutes, matching what's shown.

### Field-reset effect

```
useEffect(() => {
  if (!visible) return;
  reset({ duration: ..., roundSeconds: initialRoundSeconds, direction: initialDirection });
}, [visible, initialDuration, initialDirection, initialRoundSeconds, reset]);
```

The effect is a no-op while the sheet is closed, so it doesn't fight with
whatever the user is mid-typing; it only (re)populates the fields at the
instant `visible` flips to `true`, or if the parent hands it fresh initial
values while it's already open (e.g. the underlying table data refetches).
Because `reset` is a stable callback from the hook, the effect's real
trigger is the `visible`/`initial*` values, not `reset` itself.

## Used by

- [`lib/components/timer/TimerMenu.tsx`](TimerMenu.md)
