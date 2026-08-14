# `lib/stores/appwrite/table-store.ts`

[← lib/stores/appwrite](README.md)

## Purpose

Zustand store for the `tables` collection ([`Table`](../../models/table.md)). Read-only.

## Exports

### `useTableStore` (zustand hook)

| State/Method | Purpose |
|---|---|
| `collection: Table[]` | All `Table` documents, with `players`/`players.team`/`game` hydrated |
| `init()` | Loads the collection with those relations selected |

## How it works

`relationshipFields: ["players", "game"]` — `players` (to-many) and `game`
(to-one) are relationships; Appwrite's realtime payload can omit either on
an update that didn't touch it, so both need the relationship-omission
handling in [`real-time-store.ts`](../real-time-store.md).

## Used by

- [`lib/components/game/Table.tsx`](../../components/game/Table.md)
- [`lib/components/admin/RankingsTab.tsx`](../../components/admin/RankingsTab.md), [`StatisticsTab.tsx`](../../components/admin/StatisticsTab.md)
- [`lib/components/results/ResultsAdminTab.tsx`](../../components/results/ResultsAdminTab.md)
- [`lib/components/schedule/Schedule.tsx`](../../components/schedule/Schedule.md)
- [`lib/hooks/usePlayerTable.ts`](../../hooks/usePlayerTable.md)
- [`lib/bootstrap/RealTimeStoreProvider.tsx`](../../bootstrap/RealTimeStoreProvider.md)
- Screens: [`game.tsx`](../../../app/(pages)/(user)/game.md), [`results.tsx`](../../../app/(pages)/(user)/results.md)
