# `lib/components/admin/StatisticsTab.tsx`

[← lib/components/admin](README.md)

## Purpose

Per-game seat statistics ([`SeatCard`](../statistics/SeatCard.md) grid) plus
team-performance comparison
([`TeamPerformanceTable`](../statistics/TeamPerformanceTable.md)), with a
game picker.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `StatisticsTab` | `(): JSX.Element` | No props. Reads schedules/results/tables directly and renders the game picker, per-seat stat cards, and team-performance table for the selected game. |

### Key derived values

| Name | Signature | Behavior |
|---|---|---|
| `gameSchedules` | `useMemo(() => ScheduleEntry[], [schedules])` | Schedule entries that have a `gameId`, sorted by `sortIndex`. |
| `games` | `useMemo(() => { gameId, gameName, isActive }[], [gameSchedules])` | Deduplicates `gameSchedules` down to one entry per distinct `gameId` (a game can appear more than once in the schedule, e.g. across rounds), OR-ing `isActive` across the duplicates so a game reads as active if any of its schedule slots is. |
| `defaultGameId` | `useMemo(() => string \| null, [gameSchedules])` | Picks which game the `Combobox` should default to: the currently-active schedule's game, else the first not-yet-finished one, else the last game in the schedule, else `null`. |
| `gameStatsList` | `useMemo(() => { gameId, gameName, matches, seatStats }[], [games, results])` | Runs [`computeSeatStats`](../../utils/statistics.md) for **every** game up front, not just the selected one — see below for why. |
| `teamPerformance` | `useMemo(() => TeamSeatPerformance[], [results, tables, selected])` | Runs [`computeTeamSeatPerformance`](../../utils/statistics.md) for just the currently-selected game's stats; empty array if nothing is selected yet. |

## How it works

`games` deduplicates schedule entries sharing the same `gameId` (a game can
appear more than once in the schedule) into one entry per game, ORing
`isActive` across duplicates. `gameStatsList` pre-computes
[`computeSeatStats`](../../utils/statistics.md) for every game up front
(not just the selected one) — cheap enough to always do, and avoids
recomputing on every game switch. Selecting a game defaults to the active
one, or the next unfinished one, or the last one — matching
[`ResultsAdminTab`](../results/ResultsAdminTab.md)'s and
[`RankingsTab`](RankingsTab.md)'s own default-game logic (though each file
implements this small heuristic independently rather than sharing it).

An effect (dependencies: `defaultGameId`, `selectedGameId`) sets
`selectedGameId` to `defaultGameId` only the first time a default becomes
available (`selectedGameId === null`) — this seeds the picker once without
ever overriding a game the admin has since picked manually, even if
`defaultGameId` itself later changes (e.g. a different schedule slot
becomes active).

## Used by

- [`app/(pages)/(admin)/admin/index.tsx`](../../../app/(pages)/(admin)/admin/index.md)

## Related

- [`lib/utils/statistics.ts`](../../utils/statistics.md)
- [`lib/components/statistics/`](../statistics/README.md)
