# `lib/hooks/useRoundCountdown.ts`

[← lib/hooks](README.md)

## Purpose

Ticks a once-per-second countdown to the planned end of a
[`Schedule`](../models/schedule.md) item, so the home screen can show how
much time is left in the running round (and flag when it has run over).

This is the *planned-schedule* countdown — it is unrelated to the
per-table chess clock in [`useTimerState`](useTimerState.md), which counts
the seats' own time budgets.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `RoundCountdown` | Type | The countdown's current value |
| `useRoundCountdown(item)` | `(item: Schedule \| null \| undefined) => RoundCountdown` | Live countdown to `item`'s planned end time; returns an idle placeholder when `item` is absent |

`RoundCountdown` properties:

| Property | Type | Meaning |
|---|---|---|
| `secondsLeft` | `number` | Whole seconds until the planned end, clamped to `0` once past it |
| `label` | `string` | `MM:SS` of the *absolute* distance to the planned end — so it keeps counting up once `isOvertime` is true — or `"--:--"` when there's no item |
| `isOvertime` | `boolean` | `true` once the planned end time has been reached or passed |

### `useRoundCountdown(item: Schedule | null | undefined): RoundCountdown`

`item` — the schedule item to count down, normally the currently active
one. Only its `startTimePlanned` (`"HH:MM"`, local time) and
`durationPlanned` (minutes) are read; the end time is derived from those
two, never stored. With no item (or a schedule item still loading), it
returns the idle value `{ secondsLeft: 0, label: "--:--", isOvertime: false }`
and starts no interval.

## How it works

The 1s interval effect is keyed on `[startTimePlanned, durationPlanned]`
rather than on the `item` object itself: schedule items are re-created as
new objects by every realtime store update, so depending on the object
would tear down and re-create the interval on unrelated updates (and reset
the tick phase each time). Depending on the two primitive fields restarts
the interval only when the planned window actually changes.

`plannedEndMs` resolves `"HH:MM"` against *today's* date (the tournament's
schedule is a single-day agenda), then adds `durationPlanned` minutes.

The value is derived in a `useMemo` from `now` instead of being stored in
state, so there is exactly one source of truth (the tick) and no risk of
the label and the overtime flag disagreeing.

## Used by

- [`lib/components/home/NowPlayingCard.tsx`](../components/home/NowPlayingCard.md)
- [`lib/components/schedule/RunningNowCard.tsx`](../components/schedule/RunningNowCard.md)

## Related

- [`lib/models/schedule.ts`](../models/schedule.md)
- [`formatElapsedSeconds`](../utils.md) in `lib/utils.ts`
