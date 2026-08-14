# `lib/stores/appwrite/result-store.ts`

[← lib/stores/appwrite](README.md)

## Purpose

Zustand store for the `results` collection ([`Result`](../../models/result.md)).

## Exports

### `useResultStore` (zustand hook)

| State/Method | Purpose |
|---|---|
| `collection: Result[]` | All `Result` documents |
| `init()` | Loads the collection |
| `add(data)` | Creates a `Result` |
| `update(item, silent?)` | Partial update by `$id` |

### `type PartialResult`

`Partial<Result> & { $id: string }` — the shape `update` expects.

## Used by

- [`lib/components/admin/RankingsTab.tsx`](../../components/admin/RankingsTab.md)
- [`lib/components/admin/StatisticsTab.tsx`](../../components/admin/StatisticsTab.md)
- [`lib/components/results/ResultsAdminTab.tsx`](../../components/results/ResultsAdminTab.md)
- [`lib/components/schedule/Schedule.tsx`](../../components/schedule/Schedule.md)
- [`lib/bootstrap/RealTimeStoreProvider.tsx`](../../bootstrap/RealTimeStoreProvider.md)
- Screens: [`results.tsx`](../../../app/(pages)/(user)/results.md), [`signature.tsx`](../../../app/(pages)/(user)/signature.md)
