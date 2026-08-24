# `lib/stores/appwrite`

[← lib/stores](../README.md)

One [zustand](https://github.com/pmndrs/zustand) store per Appwrite
collection (or, for `lottery-store`, a storage bucket). Every store follows
the same shape: `collection` array, `key` (collection id), `init()` to load
+ subscribe, and CRUD methods that wrap the generic helpers from
[`real-time-store.ts`](../real-time-store.md). See that file for the shared
mechanics (realtime merge, relationship-field handling, deterministic ids).
All stores are initialized together by
[`RealTimeStoreProvider`](../../bootstrap/RealTimeStoreProvider.md).

## Files

| File | Collection/Bucket id | CRUD | Notes |
|---|---|---|---|
| [feature-flag-store.md](feature-flag-store.md) | `feature_flags` | read-only via hook | Derives a `slug → enabled` lookup map |
| [lottery-store.md](lottery-store.md) | bucket `lottery` | read-only | Mirrors a storage bucket, not a database collection |
| [options-lottery-store.md](options-lottery-store.md) | `options-lotteries` | add, update, delete | Options/results kept as JSON strings on the row |
| [player-store.md](player-store.md) | `players` | read-only | Hydrates the `team` relation |
| [result-store.md](result-store.md) | `results` | add, update | |
| [rule-store.md](rule-store.md) | `rules` | add, update, delete | |
| [schedule-store.md](schedule-store.md) | `schedule` | add, update, delete | |
| [table-bell-store.md](table-bell-store.md) | `table-bell` | add, update, delete | Deterministic per-table id |
| [table-store.md](table-store.md) | `tables` | read-only | Hydrates `players`/`players.team`/`game` |
| [team-store.md](team-store.md) | `teams` | read-only | |
| [timer-seat-store.md](timer-seat-store.md) | `timer_seats` | add, update | Deterministic per-(table,game,seat) id |
| [timer-settings-store.md](timer-settings-store.md) | `games` | add, update | Also exported as the legacy name `PartialTimerSettings` |
| [timer-store.md](timer-store.md) | `timers` | add, update | Deterministic per-(table,game) id |
| [tournament-store.md](tournament-store.md) | `tournament` | read-only | Single-document collection (global config) |
