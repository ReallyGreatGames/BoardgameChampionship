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
| `icon?` | `string` | `Ionicons` glyph name rendered next to the title (e.g. `"dice-outline"`); no icon shown when absent |
| `description?` | `string` | Description |
| `durationPlanned` | `number` | Planned duration in minutes |
| `gameId?` | `string` | Id of the [`Game`](game.md) this item plays, when applicable; absent for non-game agenda items (e.g. breaks, briefings) |
| `startTimePlanned` | `string` | Planned start time (ISO) |
| `isActive?` | `boolean` | Whether this is the currently-running schedule item; set directly by an admin action (not derived from timestamps), and expected to be true for at most one item at a time — starting a new item clears the previous one's `isActive` and marks it `isFinished` (see `Schedule.tsx`) |
| `isFinished?` | `boolean` | Whether the item has already run to completion |
| `allowUserChange?` | `boolean` | Whether players may change their team/player selection while this item is the active one; gates `PlayerSelectionCard`'s "change" action (`activeItem?.allowUserChange !== false`, so absent/undefined defaults to allowed — only an explicit `false` locks it) |

## Used by

- [`lib/components/schedule/ActiveScheduleCard.tsx`](../components/schedule/ActiveScheduleCard.md)
- [`lib/components/schedule/Schedule.tsx`](../components/schedule/Schedule.md)
- [`lib/components/schedule/ScheduleItemModal.tsx`](../components/schedule/ScheduleItemModal.md)
- [`lib/components/schedule/UpcomingList.tsx`](../components/schedule/UpcomingList.md)
- [`lib/stores/appwrite/schedule-store.ts`](../stores/appwrite/schedule-store.md)
