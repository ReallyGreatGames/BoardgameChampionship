# `lib/components/statistics/TeamPerformanceTable.tsx`

[← lib/components/statistics](README.md)

## Purpose

Table of teams' actual vs. expected average placement (relative to their
seating), with the delta highlighted green/red for over-/under-performance.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `TeamPerformanceTable` (component) | `TeamPerformanceTable({ teamPerformance: TeamSeatPerformance[] }): JSX` | Renders the heading (with an info tooltip), an empty state when there's no data, or a table with one row per team showing actual/expected placement and the delta between them. |

### Props (`Props`)

| Prop | Type | Meaning |
|---|---|---|
| `teamPerformance` | [`TeamSeatPerformance[]`](../../utils/statistics.md) | One entry per team: `teamId` (row key), `teamName`/`teamCode` (identity column), `avgActualPlacement`/`avgExpectedPlacement` (the two numeric columns, formatted to 2 decimals), and `delta` (the difference, colored and sign-prefixed). An empty array renders the `EmptyState` message instead of the table. |

## How it works

Delta coloring uses a small dead-zone (`±0.005`) around zero rather than a
strict `> 0`/`< 0` check, so floating-point noise from the averaging in
[`computeTeamSeatPerformance`](../../utils/statistics.md) doesn't color a
practically-zero delta as a (misleadingly tiny) over- or under-performance.

## Used by

- [`lib/components/admin/StatisticsTab.tsx`](../admin/StatisticsTab.md)
