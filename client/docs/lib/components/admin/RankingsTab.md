# `lib/components/admin/RankingsTab.tsx`

[← lib/components/admin](README.md)

## Purpose

Tournament-wide team ranking with an expandable per-player breakdown.

## How it works

Builds a `playerId → { tournamentPoints, placements[] }` map by walking
every submitted [`Result`](../../models/result.md), resolving each result's
table to find which player sat in each seat, and accumulating
[`computeTablePoints`](../../utils/placements.md)'s per-seat points onto
that seat's player. Team metadata (`teamMeta`) is collected alongside so
teams with zero results still appear in the final ranking (via
[`rankTeams`](../../utils/placements.md), called once with every
accumulated player stat and every known team).

`isComplete` compares `submittedResults.length >= totalTables` — a simple
count comparison, not a per-table submitted-check, since it's only used
for a coarse "all done" banner, not gating any action.

Tapping a team row expands an inline breakdown of its players, sorted by
individual tournament points.

## Used by

- [`app/(pages)/(admin)/admin/index.tsx`](../../../app/(pages)/(admin)/admin/index.md)

## Related

- [`lib/utils/placements.ts`](../../utils/placements.md) — `computeTablePoints`, `rankTeams`
