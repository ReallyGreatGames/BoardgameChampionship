# `lib/stores/appwrite/timer-store.ts`

[← lib/stores/appwrite](README.md)

## Purpose

Zustand store for the `timers` collection ([`Timer`](../../models/timer.md) —
table-wide timer settings/bookkeeping).

## Exports

### `useTimerStore` (zustand hook)

| State/Method | Purpose |
|---|---|
| `collection: Timer[]` | All `Timer` documents — `{ table, games, durationMinutesTotal?, roundSecondsTotal?, direction?, hasCustomTimer?, tableActiveAccumulatedMs?, tableActiveResumedAt?, playerPositions }` table-wide timer state |
| `init(): Promise<void>` | `fetchCollection<Timer>(key, set, [Query.select(["*", "playerPositions.*", "playerPositions.team.*"])])` — loads every `Timer` with `playerPositions` (the related `Player` documents) inlined, each with its own `team` relation expanded too, so the timer UI can show each seat's team name without a second fetch |
| `add(data: Omit<Timer, keyof Models.Document>): Promise<Timer \| null>` | Creates a `Timer` via `addToCollection(key, data, { rowId: timerRowId(data.table, resolveGameId(data.games)), silentOnConflict: true })` — `data.table`/`data.games` drive a deterministic id (see below); returns the created/existing document or `null` on a non-conflict failure |
| `update(item: PartialTimer, silent?: boolean): Promise<boolean>` | `updateInCollection(key, item, silent)` — partial update by `item.$id`; `silent` (default `false`) suppresses the failure `Alert` for frequent tick-driven writes; returns whether the update succeeded |

### `type PartialTimer`

`Partial<Timer> & { $id: string }` — the shape `update` expects.

## How it works

`add` uses [`timerRowId(table: number, gameId: string | null): string`](../../models/timer.md)
(returns `` `timer-${table}-${gameId ?? "none"}` ``) as a deterministic
document id with `silentOnConflict: true` — two devices racing to start the
same table's timer for the first time converge on one document instead of
each creating their own. `resolveGameId` (from
[`lib/utils.ts`](../../../utils.md)) normalizes `data.games` down to a
single `string | null` game id before it's folded into the row id.

`playerPositions.team.*` is selected explicitly because Appwrite doesn't
expand a relation nested two levels deep by default — without it,
`Player.team` on each seat comes back as a bare id string rather than a
[`Team`](../../models/team.md) object, which is what
[`teamName`](../../../utils.md) (used by [`TimerCell`](../../components/timer/TimerCell.md)) needs to show an actual name instead of an id.

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
