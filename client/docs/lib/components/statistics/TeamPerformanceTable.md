# `lib/components/statistics/TeamPerformanceTable.tsx`

[← lib/components/statistics](README.md)

## Purpose

Table of teams' actual vs. expected average placement (relative to their
seating), with the delta highlighted green/red for over-/under-performance.

## Props

`{ teamPerformance: TeamSeatPerformance[] }` —
[`TeamSeatPerformance`](../../utils/statistics.md) from `lib/utils/statistics.ts`.

## How it works

Delta coloring uses a small dead-zone (`±0.005`) around zero rather than a
strict `> 0`/`< 0` check, so floating-point noise from the averaging in
[`computeTeamSeatPerformance`](../../utils/statistics.md) doesn't color a
practically-zero delta as a (misleadingly tiny) over- or under-performance.

## Used by

- [`lib/components/admin/StatisticsTab.tsx`](../admin/StatisticsTab.md)
