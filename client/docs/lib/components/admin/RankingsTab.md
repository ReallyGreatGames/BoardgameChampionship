# `lib/components/admin/RankingsTab.tsx`

[← lib/components/admin](README.md)

## Purpose

Tournament-wide team ranking with an expandable per-player breakdown.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `RankingsTab` | `(): JSX.Element` | No props. Reads schedules/results/tables from their stores directly and renders the full ranking view (status banner, header row, expandable team rows). |

### Internal helper

| Function | Signature | Behavior |
|---|---|---|
| `MedalIcon` | `({ rank: number }): JSX.Element` | Renders a trophy icon for rank 1, a medal icon (in silver/bronze tint) for ranks 2–3, or the plain numeric rank otherwise. |

## How it works

Builds a `playerId → { tournamentPoints, placements[] }` map by walking
every submitted [`Result`](../../models/result.md), resolving each result's
table to find which player sat in each seat, and accumulating
[`computeTablePoints`](../../utils/placements.md)'s per-seat points onto
that seat's player. Team metadata (`teamMeta`) is collected alongside so
teams with zero results still appear in the final ranking (via
[`rankTeams`](../../utils/placements.md), called once with every
accumulated player stat and every known team).

The `rankings` `useMemo` (dependencies: `results`, `tables`) is the expensive
part of this component — it does a full re-walk of every result's placements
and re-derives every team/player's aggregated points from scratch whenever
either collection changes; there's no incremental update, since result
edits can change point totals in ways that aren't cheap to patch
incrementally (a single placement change reflows `computeTablePoints` for
the whole table).

`isComplete` compares `submittedResults.length >= totalTables` — a simple
count comparison, not a per-table submitted-check, since it's only used
for a coarse "all done" banner, not gating any action.

Tapping a team row expands an inline breakdown of its players, sorted by
individual tournament points.

## Used by

- [`app/(pages)/(admin)/admin/index.tsx`](../../../app/(pages)/(admin)/admin/index.md)

## Related

- [`lib/utils/placements.ts`](../../utils/placements.md) — `computeTablePoints`, `rankTeams`
