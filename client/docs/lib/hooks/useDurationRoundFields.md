# `lib/hooks/useDurationRoundFields.ts`

[← lib/hooks](README.md)

## Purpose

Shared duration/round-time/direction form-field state and validation for
[`CustomTimerModal`](../components/timer/CustomTimerModal.md) and
[`TimerSettingsModal`](../components/schedule/TimerSettingsModal.md) — keeps
the "0 or blank means disabled" round-seconds rule and the
duration-blur-clearing UX in exactly one place instead of letting the two
forms drift apart (which is exactly what
[`TimerDurationFields.tsx`](../components/timer/TimerDurationFields.md)'s
own extraction was meant to prevent, but only covered the JSX half).

## Exports

### `type DurationRoundInitial`

`{ duration?: number; roundSeconds?: number; direction?: "up" | "down" }`

### `useDurationRoundFields()`

Returns raw field strings (`duration`, `roundSeconds`), the current
`direction`, a `saving` flag, parsed/validated numbers (`durNum`,
`durValid`, `roundSecondsNum`, `roundSecondsValid`, `isValid`), derived
error flags (`durationInvalid`, `roundSecondsInvalid`), setters
(`setDuration`, `setRoundSeconds`, `setDirection`, `setSaving`), an
`onDurationBlur` handler, and a `reset(initial?)` function.

## How it works

- **Round-seconds rule**: an empty round-seconds field is treated as `0`
  (round-timer disabled), and `0` itself is valid — only negative or
  non-numeric input is invalid.
- **Duration blur UX**: `durationInvalid` only turns on after the field has
  been blurred at least once (`durBlurred`), so an empty/invalid field
  doesn't show an error the instant the form opens. `setDuration` clears
  the blurred-invalid flag as soon as a valid duration is typed, so the
  error disappears immediately on correction rather than waiting for
  another blur.
- **`reset(initial)`**: (re)initializes the form when a modal opens.
  `initial.duration` is expected as per-player minutes (matching what's
  displayed) — callers must pass the already-divided value. Checks are
  `!= null` (not just truthy) so a deliberately-saved `0` round-time shows
  as `"0"` instead of looking unconfigured.

## Used by

- [`lib/components/schedule/TimerSettingsModal.tsx`](../components/schedule/TimerSettingsModal.md)
- [`lib/components/timer/CustomTimerModal.tsx`](../components/timer/CustomTimerModal.md)

## Related

- [`lib/components/timer/TimerDurationFields.tsx`](../components/timer/TimerDurationFields.md) — the shared JSX half of the same extraction
