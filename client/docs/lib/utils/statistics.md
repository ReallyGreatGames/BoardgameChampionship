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

`SeatStats` properties:

| Property | Type | Meaning |
|---|---|---|
| `seat` | `number` | 0-based seat index this row summarizes |
| `matches` | `number` | Count of submitted results with a valid placement recorded for this seat |
| `wins` | `number` | Count of those matches where this seat placed 1st (ties all count) |
| `winRate` | `number \| null` | `wins / matches`, or `null` if `matches` is 0 |
| `placementCounts` | `number[]` | Histogram of raw placements for this seat, index `i` = count of `(i+1)`-th place finishes |
| `placementRates` | `(number \| null)[]` | `placementCounts` normalized to a fraction of `matches` (`null` entries if `matches` is 0) |
| `scores` | `number[]` | Every valid numeric score recorded for this seat, in result order |
| `minScore` / `maxScore` | `number \| null` | Lowest/highest of `scores`, `null` if empty |
| `avgScore` | `number \| null` | Mean of `scores`, `null` if empty |
| `medianScore` | `number \| null` | Median of `scores`, `null` if empty |
| `stdDevScore` | `number \| null` | Population standard deviation of `scores`, `null` if empty |

`TeamSeatPerformance` properties:

| Property | Type | Meaning |
|---|---|---|
| `teamId` | `string` | Team document id |
| `teamName` | `string` | Team display name |
| `teamCode` | `string` | Team's short code |
| `occurrences` | `number` | Number of times any player from this team sat at any seat for this game |
| `avgActualPlacement` | `number` | Mean of the placements the team's players actually achieved |
| `avgExpectedPlacement` | `number` | Mean of the seat-average placement (from `seatStats`) for the seats the team actually sat in — the baseline a "typical" occupant of those seats would get |
| `delta` | `number` | `avgExpectedPlacement - avgActualPlacement`; positive means the team out-performed the seats it sat in, negative means it under-performed |

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
[`resolveGameId`](../utils.md) in `lib/utils.ts`). If a team recorded no
placements at seats with a computable average (`seatAvgPlacement` is
`null` where a seat has zero matches), `avgExpectedPlacement` falls back
to the team's own `avgActualPlacement`, making `delta` `0` rather than
`NaN`. Results are sorted by `delta` descending, so the most
over-performing team is first.

## Used by

- [`lib/components/admin/StatisticsTab.tsx`](../components/admin/StatisticsTab.md)
- [`lib/components/statistics/SeatCard.tsx`](../components/statistics/SeatCard.md)
- [`lib/components/statistics/TeamPerformanceTable.tsx`](../components/statistics/TeamPerformanceTable.md)

## Related

- [`lib/models/result.ts`](../models/result.md), [`lib/models/table.ts`](../models/table.md)
