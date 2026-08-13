# `lib/stores/appwrite/timer-seat-store.ts`

[← lib/stores/appwrite](README.md)

## Purpose

Zustand store for the `timer_seats` collection
([`TimerSeat`](../../models/timer-seat.md) — per-seat timer state).

## Exports

### `useTimerSeatStore` (zustand hook)

| State/Method | Purpose |
|---|---|
| `collection: TimerSeat[]` | All `TimerSeat` documents |
| `init()` | Loads the collection |
| `add(data)` | Creates a `TimerSeat` with a deterministic id (see below) |
| `update(item, silent?)` | Partial update by `$id` |

### `type PartialTimerSeat`

`Partial<TimerSeat> & { $id: string }` — the shape `update` expects.

## How it works

`add` uses [`timerSeatRowId(table, gameId, seat)`](../../models/timer-seat.md)
as a deterministic document id with `silentOnConflict: true` — two devices
racing to start the same seat's timer for the first time converge on one
document instead of each creating their own.

## Used by

- [`lib/hooks/useTimerState.ts`](../../hooks/useTimerState.md) — the entire timer logic
- [`lib/components/results/ResultsAdminTab.tsx`](../../components/results/ResultsAdminTab.md)
- [`lib/bootstrap/RealTimeStoreProvider.tsx`](../../bootstrap/RealTimeStoreProvider.md)

## Related

- [`lib/models/timer-seat.ts`](../../models/timer-seat.md)
- [`lib/stores/appwrite/timer-store.ts`](timer-store.md) — the table-wide counterpart
