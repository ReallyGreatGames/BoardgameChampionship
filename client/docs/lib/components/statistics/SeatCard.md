# `lib/components/statistics/SeatCard.tsx`

[← lib/components/statistics](README.md)

## Purpose

One seat's statistics card: win-rate bar, a placement-distribution pie
chart with legend, and a column of score stats (min/avg/median/max/std dev).

## Props

`{ seat: SeatStats }` — [`SeatStats`](../../utils/statistics.md) from
`lib/utils/statistics.ts`.

## How it works

Placement is ordinal (1st is strictly better than 2nd, etc.), so pie slices
use one hue (`colors.primary`) at monotone decreasing opacity steps
(`PLACEMENT_OPACITIES = ["FF","CC","88","44"]`) per placement, rather than
unrelated categorical colors that would imply the placements are unordered
categories.

## Used by

- [`lib/components/admin/StatisticsTab.tsx`](../admin/StatisticsTab.md)

## Related

- [`lib/components/ui/PieChart.tsx`](../ui/PieChart.md)
- [`lib/components/statistics/PlacementLegend.tsx`](PlacementLegend.md), [`StatRow.tsx`](StatRow.md)
