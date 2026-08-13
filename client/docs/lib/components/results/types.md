# `lib/components/results/types.ts`

[← lib/components/results](README.md)

## Purpose

Shared `TableEntry` type: one table's fully resolved state, combining data
from five different Appwrite collections into a single shape that
[`ResultsAdminTab`](ResultsAdminTab.md) builds once per table and
[`TableCard`](TableCard.md) renders.

## Exports

### `type TableEntry`

| Field | Type | Meaning |
|---|---|---|
| `id` | `number` | Table number |
| `players` | [`Player[]`](../../models/player.md) | Seated players |
| `timer` | [`Timer`](../../models/timer.md) `\| undefined` | Table-wide timer settings/bookkeeping only — per-seat running state lives in `seats` |
| `seats` | [`TimerSeat[]`](../../models/timer-seat.md) | This table's seat documents, sparse — a seat with no document yet simply hasn't been touched (see [`TableCard`](TableCard.md)'s per-seat fallbacks) |
| `result` | [`Result`](../../models/result.md) `\| undefined` | This table's result, if any exists yet |
| `bell` | [`TableBell`](../../models/table-bell.md) `\| undefined` | This table's active/acknowledged bell, if any |
| `hasBell` | `boolean` | Whether there's an unacknowledged bell |
| `bellAcknowledged` | `boolean` | Whether the bell has been acknowledged |
| `isRunning` | `boolean` | Whether a `Timer` document exists at all |
| `isSubmitted` | `boolean` | Whether the result has been submitted |
| `hasNote` | `boolean` | Whether the result has a note |
| `timerDirection` | `"up" \| "down"` | Effective timer direction, resolved from the timer doc or the game's timer settings |
| `timerTotalSeconds` | `number` | Effective per-player total seconds |
| `timerRoundSecondsTotal` | `number` | Effective per-player round-time budget in seconds — `0` disables round-time accounting |

## Used by

- [`lib/components/results/ResultsAdminTab.tsx`](ResultsAdminTab.md) — builds `TableEntry[]`
- [`lib/components/results/TableCard.tsx`](TableCard.md) — renders one `TableEntry`
