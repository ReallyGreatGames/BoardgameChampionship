# `lib/utils/statistics.ts`

[← lib/utils](README.md)

## Purpose

Computes per-seat statistics and team-performance evaluations across all
submitted results of a game.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `computeSeatStats(results, gameId, playerCount?)` | `(Result[], string, number?) => SeatStats[]` | Win rate, placement distribution, and score statistics per seat |
| `computeTeamSeatPerformance(results, tables, gameId, seatStats)` | `(Result[], Table[], string, SeatStats[]) => TeamSeatPerformance[]` | Compares team performance against the seat average |
| `SeatStats` | Type | `{ seat, matches, wins, winRate, placementCounts, placementRates, scores, minScore, maxScore, avgScore, medianScore, stdDevScore }` |
| `TeamSeatPerformance` | Type | `{ teamId, teamName, teamCode, occurrences, avgActualPlacement, avgExpectedPlacement, delta }` |

## How it works

### `computeSeatStats`

Only considers submitted (`submitted: true`) results for the given game.
For each seat: win rate (a tied first place counts as a win for **every**
tied seat), placement distribution, and min/max/average/median/standard
deviation of scores (only over rounds with a valid number).

### `computeTeamSeatPerformance`

For every team that played a game: compares the team's actual average
placement against the average placement *every other* team got from the
same seats they sat in (`seatStats` as the baseline) — flags teams that
over- or under-perform relative to their seating (`delta = expected -
actual`, positive = better than the baseline). Tables are matched via
`resolveGameId(t.game) === gameId` and `tableNumber === result.table` (see
[`resolveGameId`](../utils.md) in `lib/utils.ts`).

## Used by

- [`lib/components/admin/StatisticsTab.tsx`](../components/admin/StatisticsTab.md)
- [`lib/components/statistics/SeatCard.tsx`](../components/statistics/SeatCard.md)
- [`lib/components/statistics/TeamPerformanceTable.tsx`](../components/statistics/TeamPerformanceTable.md)

## Related

- [`lib/models/result.ts`](../models/result.md), [`lib/models/table.ts`](../models/table.md)
