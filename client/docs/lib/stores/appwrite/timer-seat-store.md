# `lib/stores/appwrite/timer-seat-store.ts`

[← lib/stores/appwrite](README.md)

## Purpose

Zustand store for the `timer_seats` collection
([`TimerSeat`](../../models/timer-seat.md) — per-seat timer state).

## Exports

### `useTimerSeatStore` (zustand hook)

| State/Method | Purpose |
|---|---|
| `collection: TimerSeat[]` | All `TimerSeat` documents — `{ table, games, seat, playerTime, paused, inOvertime, roundTimeLeft, roundExpired, roundLastPausedAt }` per-seat timer state |
| `init(): Promise<void>` | `fetchCollection(key, set)` — loads the full `timer_seats` collection with no query filter |
| `add(data: Omit<TimerSeat, keyof Models.Document>): Promise<TimerSeat \| null>` | Creates a `TimerSeat` via `addToCollection(key, data, { rowId: timerSeatRowId(data.table, resolveGameId(data.games), data.seat), silentOnConflict: true })` — `data.table`/`data.games`/`data.seat` drive a deterministic id (see below); returns the created/existing document or `null` on a non-conflict failure |
| `update(item: PartialTimerSeat, silent?: boolean): Promise<boolean>` | `updateInCollection(key, item, silent)` — partial update by `item.$id`; `silent` (default `false`) suppresses the failure `Alert` for frequent tick-driven writes; returns whether the update succeeded |

### `type PartialTimerSeat`

`Partial<TimerSeat> & { $id: string }` — the shape `update` expects.

## How it works

`add` uses [`timerSeatRowId(table: number, gameId: string | null, seat: number): string`](../../models/timer-seat.md)
(returns `` `timer-seat-${table}-${gameId ?? "none"}-${seat}` ``) as a
deterministic document id with `silentOnConflict: true` — two devices
racing to start the same seat's timer for the first time converge on one
document instead of each creating their own. `resolveGameId` (from
[`lib/utils.ts`](../../../utils.md)) normalizes `data.games` — which may
arrive as a plain string id, an array of related documents, or a single
related document — down to a single `string | null` game id before it's
folded into the row id.

## Used by

- [`lib/hooks/useTimerState.ts`](../../hooks/useTimerState.md) — the entire timer logic
- [`lib/components/results/ResultsAdminTab.tsx`](../../components/results/ResultsAdminTab.md)
- [`lib/bootstrap/RealTimeStoreProvider.tsx`](../../bootstrap/RealTimeStoreProvider.md)

## Related

- [`lib/models/timer-seat.ts`](../../models/timer-seat.md)
- [`lib/stores/appwrite/timer-store.ts`](timer-store.md) — the table-wide counterpart
