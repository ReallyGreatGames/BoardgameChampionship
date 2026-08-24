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

Takes no parameters. Holds five pieces of `useState` (`duration`,
`roundSeconds` as raw strings; `direction`; `saving`; `durBlurred`,
internal-only), derives validation on every render from the raw strings,
and returns:

| Property | Type | Meaning |
|---|---|---|
| `duration` | `string` | Raw text of the duration field (per-player minutes), as typed. |
| `roundSeconds` | `string` | Raw text of the round-seconds field, as typed. |
| `direction` | `"up" \| "down"` | Whether the timer counts up or down; defaults to `"down"`. |
| `saving` | `boolean` | Caller-controlled flag (via `setSaving`) for disabling the form while a save request is in flight. |
| `durNum` | `number` | `parseInt(duration, 10)` — may be `NaN`. |
| `durValid` | `boolean` | `true` if `durNum` parsed and is `> 0`. |
| `roundSecondsNum` | `number` | `parseInt(roundSeconds, 10)`, or `0` if the field is blank/whitespace. |
| `roundSecondsValid` | `boolean` | `true` if `roundSecondsNum` parsed and is `>= 0` (`0` = round-timer disabled, and is valid). |
| `isValid` | `boolean` | `durValid && roundSecondsValid` — overall form validity for enabling a save button. |
| `durationInvalid` | `boolean` | `true` only once the field has been blurred (`durBlurred`) and currently holds non-empty, invalid text — drives the error-message UI. |
| `roundSecondsInvalid` | `boolean` | `true` if the field holds non-empty, invalid text (no blur-gating, unlike duration). |
| `setDuration` | `(v: string) => void` | Updates `duration` and, if the field was previously flagged invalid after a blur, clears that flag as soon as the new text parses to a valid positive number (see How it works). |
| `setRoundSeconds` | `(v: string) => void` | Plain state setter for `roundSeconds`. |
| `setDirection` | `(d: "up" \| "down") => void` | Plain state setter for `direction`. |
| `setSaving` | `(s: boolean) => void` | Plain state setter for `saving`. |
| `onDurationBlur` | `() => void` | Marks the duration field as blurred (`durBlurred = true`), enabling `durationInvalid` to turn on. |
| `reset` | `(initial?: DurationRoundInitial) => void` | Re-initializes all fields from `initial` (or hook defaults if omitted/fields omitted) and clears `saving`/`durBlurred`. |

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
