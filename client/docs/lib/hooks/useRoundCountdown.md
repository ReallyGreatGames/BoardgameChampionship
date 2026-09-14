# `lib/hooks/useRoundCountdown.ts`

[← lib/hooks](README.md)

## Purpose

Ticks a once-per-second countdown to the planned end of a
[`Schedule`](../models/schedule.md) item, so the home screen can show how
much time is left in the running round (and flag when it has run over, or
when it's been paused).

This is the *planned-schedule* countdown — it is unrelated to the
per-table chess clock in [`useTimerState`](useTimerState.md), which counts
the seats' own time budgets. It does, however, share that hook's
pause/resume mechanics (see below).

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `RoundCountdown` | Type | The countdown's current value |
| `useRoundCountdown(item)` | `(item: Schedule \| null \| undefined) => RoundCountdown` | Live countdown to `item`'s planned end, accounting for any paused time; returns an idle placeholder when `item` is absent |

`RoundCountdown` properties:

| Property | Type | Meaning |
|---|---|---|
| `secondsLeft` | `number` | Whole seconds of planned duration not yet elapsed, clamped to `0` once past it. Frozen while paused. |
| `label` | `string` | `MM:SS` of the *absolute* distance to the planned end — so it keeps counting up once `isOvertime` is true — or `"--:--"` when there's no item |
| `isOvertime` | `boolean` | `true` once the planned duration has fully elapsed |
| `isPaused` | `boolean` | `true` while the item is active but paused — see [`Schedule.tsx`](../components/schedule/Schedule.md)'s "Pausing the active item" |

### `useRoundCountdown(item: Schedule | null | undefined): RoundCountdown`

`item` — the schedule item to count down, normally the currently active
one. Reads `durationPlanned` (minutes) plus `activeAccumulatedMs`/
`activeResumedAt` (elapsed-time bookkeeping — see
[`Schedule`](../models/schedule.md)); nothing is derived from
`startTimePlanned`, which this feature no longer uses. With no item (or a
schedule item still loading, i.e. `durationPlanned` undefined), it returns
the idle value `{ secondsLeft: 0, label: "--:--", isOvertime: false, isPaused: false }`
and starts no interval.

## How it works

Elapsed time is computed via
[`computeTableElapsedSeconds(activeAccumulatedMs, activeResumedAt, now)`](../utils.md)
— the same accumulated-time/resumed-at helper `useTimerState` uses for the
per-table clock, reused here rather than reimplemented. `secondsLeft` is
`durationPlanned * 60 - elapsedSeconds`; `isPaused` is simply
`!activeResumedAt`.

The 1s interval effect is keyed on `[durationPlanned, activeResumedAt]`
rather than on the `item` object itself: schedule items are re-created as
new objects by every realtime store update, so depending on the object
would tear down and re-create the interval on unrelated updates (and reset
the tick phase each time). It's also how pausing actually stops the tick:
`activeResumedAt` goes falsy the moment `Schedule.tsx`'s `handlePause`
clears it, the effect's guard (`!activeResumedAt`) then skips creating a
new interval, and — since `computeTableElapsedSeconds` returns just
`activeAccumulatedMs` while `resumedAtIso` is falsy, ignoring `now`
entirely — `secondsLeft` stays exactly where it was regardless of the
stale `now` left over from before the pause.

The value is derived in a `useMemo` from `now` instead of being stored in
state, so there is exactly one source of truth (the tick) and no risk of
the label and the overtime flag disagreeing.

## Used by

- [`lib/components/home/NowPlayingCard.tsx`](../components/home/NowPlayingCard.md)
- [`lib/components/schedule/RunningNowCard.tsx`](../components/schedule/RunningNowCard.md)

## Related

- [`lib/models/schedule.ts`](../models/schedule.md)
- [`computeTableElapsedSeconds`, `formatElapsedSeconds`](../utils.md) in `lib/utils.ts`
- [`useTimerState.ts`](useTimerState.md) — the per-table clock using the same accumulated-time/resumed-at pattern
