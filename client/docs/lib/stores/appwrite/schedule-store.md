# `lib/stores/appwrite/schedule-store.ts`

[← lib/stores/appwrite](README.md)

## Purpose

Zustand store for the `schedule` collection ([`Schedule`](../../models/schedule.md)).

## Exports

### `useScheduleStore` (zustand hook)

| State/Method | Purpose |
|---|---|
| `collection: Schedule[]` | All `Schedule` documents |
| `init()` | Loads the collection |
| `add(data)` | Creates a `Schedule` item |
| `update(item)` | Partial update by `$id` |
| `delete(data)` | Deletes a `Schedule` item |

### `type PartialSchedule`

`Partial<Schedule> & { $id: string }` — the shape `update`/`delete` expect.

## Used by

- [`lib/components/schedule/ActiveScheduleCard.tsx`](../../components/schedule/ActiveScheduleCard.md), [`Schedule.tsx`](../../components/schedule/Schedule.md), [`ScheduleItemModal.tsx`](../../components/schedule/ScheduleItemModal.md), [`UpcomingList.tsx`](../../components/schedule/UpcomingList.md)
- [`lib/components/admin/RankingsTab.tsx`](../../components/admin/RankingsTab.md), [`StatisticsTab.tsx`](../../components/admin/StatisticsTab.md)
- [`lib/components/results/ResultsAdminTab.tsx`](../../components/results/ResultsAdminTab.md)
- [`lib/components/ui/PlayerSelectionCard.tsx`](../../components/ui/PlayerSelectionCard.md)
- [`lib/bootstrap/RealTimeStoreProvider.tsx`](../../bootstrap/RealTimeStoreProvider.md)
- Screens: [`game.tsx`](../../../app/(pages)/(user)/game.md), [`results.tsx`](../../../app/(pages)/(user)/results.md), [`app/index.tsx`](../../../app/index.md)
