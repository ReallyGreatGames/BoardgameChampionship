# `lib/stores/appwrite/timer-store.ts`

[← lib/stores/appwrite](README.md)

## Purpose

Zustand store for the `timers` collection ([`Timer`](../../models/timer.md) —
table-wide timer settings/bookkeeping).

## Exports

### `useTimerStore` (zustand hook)

| State/Method | Purpose |
|---|---|
| `collection: Timer[]` | All `Timer` documents |
| `init()` | Loads the collection (with `playerPositions.*` selected) |
| `add(data)` | Creates a `Timer` with a deterministic id (see below) |
| `update(item, silent?)` | Partial update by `$id` |

### `type PartialTimer`

`Partial<Timer> & { $id: string }` — the shape `update` expects.

## How it works

`add` uses [`timerRowId(table, gameId)`](../../models/timer.md) as a
deterministic document id with `silentOnConflict: true` — two devices
racing to start the same table's timer for the first time converge on one
document instead of each creating their own.

`relationshipFields: ["playerPositions"]` — `playerPositions` (to-many) is
the only relationship attribute on this document; every other field
(including the nullable `tableActiveResumedAt`) is a plain attribute and
must not get the relationship-omission treatment (see
[`real-time-store.ts`](../real-time-store.md)).

## Used by

- [`lib/hooks/useTimerState.ts`](../../hooks/useTimerState.md) — the entire timer logic
- [`lib/components/results/ResultsAdminTab.tsx`](../../components/results/ResultsAdminTab.md)
- [`app/(pages)/(user)/game.tsx`](../../../app/(pages)/(user)/game.md)
- [`lib/bootstrap/RealTimeStoreProvider.tsx`](../../bootstrap/RealTimeStoreProvider.md)

## Related

- [`lib/models/timer.ts`](../../models/timer.md)
- [`lib/stores/appwrite/timer-seat-store.ts`](timer-seat-store.md) — the per-seat counterpart
