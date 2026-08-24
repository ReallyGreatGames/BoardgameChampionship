# `lib/models`

Pure TypeScript type definitions for the app's Appwrite documents. Each file
defines exactly one domain type (plus, where relevant, a helper for building
a deterministic document id) and has **no** runtime logic. All types extend
`Models.Document` (or `Models.Row & Models.Document`) from
`react-native-appwrite`, which is how they automatically get Appwrite
metadata such as `$id`, `$createdAt`, `$updatedAt`.

These models are the vocabulary that [`lib/stores/appwrite`](../stores/appwrite/README.md)
(CRUD + realtime), the hooks in [`lib/hooks`](../hooks/README.md), and the
components under [`lib/components`](../components/README.md) use to talk
about Appwrite data.

## Files

| File | Type | Purpose |
|---|---|---|
| [feature-flag.md](feature-flag.md) | `FeatureFlag` | A feature flag (on/off) |
| [game.md](game.md) | `Game` | A game/title with its default timer settings |
| [options-lottery.md](options-lottery.md) | `OptionsLottery`, `OptionsLotteryRow`, `LotteryOption`, `LotteryTableResult` | A named, weighted pool drawn once per table |
| [player.md](player.md) | `Player` | A player, with their team |
| [result.md](result.md) | `Result` | Result of a table round (placements, scores, signatures) |
| [rule.md](rule.md) | `Rule`, `RuleType` | A rule change/addition/clarification for a game |
| [schedule.md](schedule.md) | `Schedule` | One item in the tournament schedule |
| [table-bell.md](table-bell.md) | `TableBell`, `bellRowId` | A "table needs staff attention" event |
| [table.md](table.md) | `Table` | A table with its assigned players and game |
| [team.md](team.md) | `Team` | A team/nation |
| [timer-seat.md](timer-seat.md) | `TimerSeat`, `timerSeatRowId` | Timer state of a single seat |
| [timer.md](timer.md) | `Timer`, `timerRowId` | Table-wide timer settings/bookkeeping |
| [tournament.md](tournament.md) | `Tournament` | Global tournament configuration (locale, PIN, type) |

## Why `Timer` and `TimerSeat` are split

Historically, the full timer state of all four seats (pool time, round
time, pause flag, overtime) lived as four-entry arrays directly on a single
`Timer` document per table. Appwrite has no index-level array merge — any
write replaced all four seats at once. Two devices racing to update
different seats at the same time could therefore silently clobber each
other (a slightly stale write from device A could undo device B's change to
an *unrelated* seat). The fix: each seat is now its own Appwrite document
(`TimerSeat`), so two devices touching different seats also touch different
Appwrite rows. `Timer` keeps only what's genuinely shared across the whole
table (duration, round-time budget, direction, table-elapsed bookkeeping).

The actual logic that works with both models lives in
[`useTimerState`](../hooks/useTimerState.md).
