# `lib/components/admin/StatisticsTab.tsx`

[← lib/components/admin](README.md)

## Purpose

Per-game seat statistics ([`SeatCard`](../statistics/SeatCard.md) grid) plus
team-performance comparison
([`TeamPerformanceTable`](../statistics/TeamPerformanceTable.md)), with a
game picker.

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

## Used by

- [`app/(pages)/(admin)/admin/index.tsx`](../../../app/(pages)/(admin)/admin/index.md)

## Related

- [`lib/utils/statistics.ts`](../../utils/statistics.md)
- [`lib/components/statistics/`](../statistics/README.md)
