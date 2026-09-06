# `lib/stores/appwrite/result-store.ts`

[← lib/stores/appwrite](README.md)

## Purpose

Zustand store for the `results` collection ([`Result`](../../models/result.md)).

## Exports

### `useResultStore` (zustand hook)

| State/Method | Purpose |
|---|---|
| `collection: Result[]` | All `Result` documents — one per team-per-game score/placement entry |
| `init(): Promise<void>` | `fetchCollection(key, set)` — loads the full `results` collection with no query filter |
| `add(data: Omit<Result, keyof Models.Document>): Promise<Result \| null>` | Creates a `Result` via `addToCollection(key, data)` with an auto-generated (`ID.unique()`) id; returns the created document or `null` (with an `Alert`) on failure |
| `update(item: PartialResult, silent?: boolean): Promise<boolean>` | `updateInCollection(key, item, silent)` — partial update by `item.$id`; `silent` (default `false`) suppresses the failure `Alert`, useful for best-effort background writes; returns whether the update succeeded |

### `type PartialResult`

`Partial<Result> & { $id: string }` — the shape `update` expects.

## Used by

- [`lib/components/admin/RankingsTab.tsx`](../../components/admin/RankingsTab.md)
- [`lib/components/admin/StatisticsTab.tsx`](../../components/admin/StatisticsTab.md)
- [`lib/components/results/ResultsAdminTab.tsx`](../../components/results/ResultsAdminTab.md)
- [`lib/components/schedule/Schedule.tsx`](../../components/schedule/Schedule.md)
- [`lib/hooks/useParticipantOverview.ts`](../../hooks/useParticipantOverview.md)
- [`lib/bootstrap/RealTimeStoreProvider.tsx`](../../bootstrap/RealTimeStoreProvider.md)
- Screens: [`results.tsx`](../../../app/(pages)/(user)/results.md), [`signature.tsx`](../../../app/(pages)/(user)/signature.md)
