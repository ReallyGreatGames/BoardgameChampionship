# `lib/components/schedule`

[← lib/components](../README.md)

The tournament schedule: a shared read+admin-edit list
([`Schedule.tsx`](Schedule.md), exporting `ScheduleList`) with its header,
its two row renderers and its two edit modals, plus two small home-screen
widgets (`ActiveScheduleCard`, `UpcomingList`).

## Files

| File | Purpose |
|---|---|
| [ActiveScheduleCard.md](ActiveScheduleCard.md) | Home-screen card for the currently active schedule item |
| [RunningNowCard.md](RunningNowCard.md) | The running item as the schedule's lead card: progress, remaining time, admin actions |
| [Schedule.md](Schedule.md) | The grouped schedule list and all of the feature's store logic |
| [ScheduleHeader.md](ScheduleHeader.md) | The schedule screen's hero (menu button, item count, title, admin pill) |
| [ScheduleItemModal.md](ScheduleItemModal.md) | Add/edit modal for one schedule item |
| [ScheduleRow.md](ScheduleRow.md) | One collapsed/expandable entry, for both the "up next" and "done" groups |
| [TimerSettingsModal.md](TimerSettingsModal.md) | Add/edit modal for a game's default timer settings + player colors |
| [UpcomingList.md](UpcomingList.md) | Home-screen list of upcoming schedule items |
| [useOpenGame.md](useOpenGame.md) | Shared "go to game" navigation for the two row renderers |
