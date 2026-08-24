# `lib/stores/appwrite/schedule-store.ts`

[← lib/stores/appwrite](README.md)

## Purpose

Zustand store for the `schedule` collection ([`Schedule`](../../models/schedule.md)).

## Exports

### `useScheduleStore` (zustand hook)

| State/Method | Purpose |
|---|---|
| `collection: Schedule[]` | All `Schedule` documents — the tournament's agenda entries |
| `init(): Promise<void>` | `fetchCollection(key, set)` — loads the full `schedule` collection with no query filter |
| `add(data: Omit<Schedule, keyof Models.Document>): Promise<Schedule \| null>` | Creates a `Schedule` item via `addToCollection(key, data)` with an auto-generated (`ID.unique()`) id; returns the created document or `null` (with an `Alert`) on failure |
| `update(item: PartialSchedule): Promise<boolean>` | `updateInCollection(key, item)` — partial update by `item.$id`; returns whether the update succeeded |
| `delete(data: PartialSchedule): Promise<boolean>` | `removeFromCollection(key, data)` — deletes the `Schedule` item by `data.$id`; returns whether the delete succeeded |

### `type PartialSchedule`

`Partial<Schedule> & { $id: string }` — the shape `update`/`delete` expect.

## Used by

- [`lib/components/schedule/ActiveScheduleCard.tsx`](../../components/schedule/ActiveScheduleCard.md), [`Schedule.tsx`](../../components/schedule/Schedule.md), [`ScheduleItemModal.tsx`](../../components/schedule/ScheduleItemModal.md), [`UpcomingList.tsx`](../../components/schedule/UpcomingList.md)
- [`lib/components/admin/RankingsTab.tsx`](../../components/admin/RankingsTab.md), [`StatisticsTab.tsx`](../../components/admin/StatisticsTab.md), [`ImportRules.tsx`](../../components/admin/ImportRules.md)
- [`lib/components/results/ResultsAdminTab.tsx`](../../components/results/ResultsAdminTab.md)
- [`lib/components/ui/PlayerSelectionCard.tsx`](../../components/ui/PlayerSelectionCard.md)
- [`lib/bootstrap/RealTimeStoreProvider.tsx`](../../bootstrap/RealTimeStoreProvider.md)
- Screens: [`game.tsx`](../../../app/(pages)/(user)/game.md), [`results.tsx`](../../../app/(pages)/(user)/results.md), [`app/index.tsx`](../../../app/index.md)
