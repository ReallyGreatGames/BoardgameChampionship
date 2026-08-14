# `lib/models/schedule.ts`

[← lib/models](README.md)

## Purpose

Appwrite document type `Schedule` — one item in the tournament schedule.

## Exports

### `type Schedule`

| Field | Type | Meaning |
|---|---|---|
| `sortIndex` | `number` | Order within the schedule |
| `title` | `string` | Title |
| `icon?` | `string` | Icon name |
| `description?` | `string` | Description |
| `durationPlanned` | `number` | Planned duration in minutes |
| `gameId?` | `string` | Associated game |
| `startTimePlanned` | `string` | Planned start time (ISO) |
| `isActive?` | `boolean` | Active = `actualStartTime` set and no `actualEndTime` |
| `isFinished?` | `boolean` | Whether the item has finished |
| `allowUserChange?` | `boolean` | Whether users may start/change this item themselves |

## Used by

- [`lib/components/schedule/ActiveScheduleCard.tsx`](../components/schedule/ActiveScheduleCard.md)
- [`lib/components/schedule/Schedule.tsx`](../components/schedule/Schedule.md)
- [`lib/components/schedule/ScheduleItemModal.tsx`](../components/schedule/ScheduleItemModal.md)
- [`lib/components/schedule/UpcomingList.tsx`](../components/schedule/UpcomingList.md)
- [`lib/stores/appwrite/schedule-store.ts`](../stores/appwrite/schedule-store.md)
