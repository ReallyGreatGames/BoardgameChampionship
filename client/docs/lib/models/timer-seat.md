# `lib/models/timer-seat.ts`

[← lib/models](README.md)

## Purpose

Defines the Appwrite document type `TimerSeat`: the timer state of **one
single seat** — one document per (table, game, seat) triple.

## Background

Split out of the old single per-table `Timer` document (which held these
values as four-entry arrays) so two seats can be written independently.
That was the actual cause of a cross-device race: Appwrite has no
index-level array merge, so any write to the old document replaced all
four seats at once, letting a slightly-stale write from one device
silently undo a different device's change to an UNRELATED seat. With one
row per seat, two devices touching different seats now touch different
Appwrite rows — there's nothing left to clobber. The table-wide fields
(duration, round-time budget, direction, table-elapsed bookkeeping) stay
shared on [`Timer`](timer.md).

## Exports

### `type TimerSeat`

| Field | Type | Meaning |
|---|---|---|
| `table` | `number` | Table number |
| `games` | `string \| null` | Game id |
| `seat` | `number` | 0-based seat index within the table (see `PLAYER_COUNT` in [useTimerState](../hooks/useTimerState.md)) |
| `playerTime` | `number` | Pool seconds remaining. Ticks down uniformly regardless of `direction` — direction only changes how this is *displayed* (see [TimerCell.tsx](../components/timer/TimerCell.md)). Goes negative once exhausted; the magnitude is the overtime overage |
| `paused` | `boolean` | Whether the seat is paused |
| `inOvertime` | `boolean` | Whether the seat's pool has been fully used up |
| `roundTimeLeft` | `number` | Round-time seconds remaining — only ticks while `roundExpired` is false and the table's `roundSecondsTotal > 0` |
| `roundExpired` | `boolean` | Whether the seat's round-time phase has ended for the current round |
| `roundLastPausedAt` | `string \| null` | ISO timestamp of this seat's last pause, used to grant a short grace window (`ROUND_RESET_GRACE_MS` in `useTimerState`) so a quick pause/unpause doesn't reset the seat's round time |

### `function timerSeatRowId(table, gameId, seat): string`

Deterministic document id (`timer-seat-{table}-{gameId ?? "none"}-{seat}`) —
same reasoning as `timerRowId` in `timer.ts`: two devices racing to create
the same seat's first document converge on one row instead of each creating
its own (see [timer-seat-store.ts](../stores/appwrite/timer-seat-store.md)'s
`silentOnConflict`).

## Used by

- [`lib/hooks/useTimerState.ts`](../hooks/useTimerState.md) — the entire timer logic
- [`lib/stores/appwrite/timer-seat-store.ts`](../stores/appwrite/timer-seat-store.md)
- [`lib/components/results/types.ts`](../components/results/types.md)
- [`lib/components/results/ResultsAdminTab.tsx`](../components/results/ResultsAdminTab.md)

## Related

- [`lib/models/timer.ts`](timer.md)
