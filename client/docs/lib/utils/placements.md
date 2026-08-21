# `lib/utils/placements.ts`

[← lib/utils](README.md)

## Purpose

Validation of placement input and computation of tournament points and
team rankings for a 4-player table.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `isValidPlacementCombo(placements)` | `(string[]) => boolean` | Checks whether a placement combination for 4 players is valid |
| `hasScorePlacementConflict(placements, scores)` | `(string[], string[]) => boolean` | Detects conflicts between placement and score |
| `computeTablePoints(placements)` | `(string[]) => (number \| null)[]` | Computes tournament points per seat |
| `rankTeams(playerStats, teams)` | `(PlayerStat[], Team[]) => TeamRanking[]` | Aggregates player statistics into a team ranking |
| `PlayerStat` | Type | Aggregated per-player statistic, input to `rankTeams` |
| `TeamRanking` | Type | Resulting ranking of one team |

`PlayerStat` properties:

| Property | Type | Meaning |
|---|---|---|
| `playerId` | `string` | Player's document id |
| `playerName` | `string` | Display name |
| `teamId` | `string` | Id of the team this player is grouped into by `rankTeams` |
| `tournamentPoints` | `number` | Total points already earned by this player across all played games |
| `placements` | `number[]` | Every raw placement (1st/2nd/3rd/4th) this player has recorded, one per game played |

`TeamRanking` properties:

| Property | Type | Meaning |
|---|---|---|
| `rank` | `number` | 1-based position in the final sorted ranking |
| `teamId` | `string` | Team document id |
| `teamName` | `string` | Team display name |
| `teamCode` | `string` | Team's short code |
| `totalPoints` | `number` | Sum of `tournamentPoints` across all of the team's players |
| `avgPlacement` | `number` | Mean of every placement recorded by any player on the team (`999` if the team has none, so it sorts last) |
| `secondPlaces` | `number` | Count of `2` values across all of the team's players' `placements` |
| `thirdPlaces` | `number` | Count of `3` values across all of the team's players' `placements` |
| `players` | `PlayerStat[]` | The team's constituent player stats, unmodified |

## How it works

### `isValidPlacementCombo`

Valid placement combinations for 4 players follow the "block rule": the
first (sorted) value must be `1`, and each block of equal values `v` with
count `n` must be followed by `v+n` (or the end of the array) — this allows
ties (e.g. `1,2,2,4`) but forbids gaps or jumps that don't correspond to a
valid ranking scheme (e.g. `1,2,2,3`).

### `hasScorePlacementConflict`

Returns `true` if any player with a better rank (lower placement number)
has a strictly lower score than a player with a worse rank. Equal scores at
different places are fine (tiebreakers exist). Pairs with a missing
placement/score are skipped.

### `computeTablePoints`

Points scale is 5-3-2-1 per place. On a tie, the points for the shared
places are averaged (e.g. two players tied for 2nd split the points for
2nd and 3rd). Returns `null` for every seat if any placement is missing.

### `rankTeams`

Aggregates player statistics into team totals and sorts by: total points
(descending) → average placement (ascending) → number of 2nd places
(descending) → number of 3rd places (descending) → best individual
placements (element-wise comparison of the sorted placement lists).

## Used by

- [`app/(pages)/(user)/results.tsx`](../../app/(pages)/(user)/results.md)
- [`lib/components/admin/RankingsTab.tsx`](../components/admin/RankingsTab.md)
- [`lib/components/results/ResultsAdminTab.tsx`](../components/results/ResultsAdminTab.md)
