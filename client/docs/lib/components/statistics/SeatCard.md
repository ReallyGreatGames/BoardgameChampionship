# `lib/components/statistics/SeatCard.tsx`

[← lib/components/statistics](README.md)

## Purpose

One seat's statistics card: win-rate bar, a placement-distribution pie
chart with legend, and a column of score stats (min/avg/median/max/std dev).

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `SeatCard` (component) | `SeatCard({ seat: SeatStats }): JSX` | Renders one seat's full stats card: title, win-rate bar, placement pie chart + legend, and a score-stats column. |

### Props (`Props`)

| Prop | Type | Meaning |
|---|---|---|
| `seat` | [`SeatStats`](../../utils/statistics.md) | Aggregated stats for one seat. Fields consumed here: `seat` (index, used for the "Seat N" title), `winRate`/`wins`/`matches` (the win-rate bar), `placementCounts`/`placementRates` (the pie chart and legend), and `minScore`/`avgScore`/`medianScore`/`maxScore`/`stdDevScore` (the score column). |

### Internal functions

| Function | Signature | Behavior |
|---|---|---|
| `formatPercent` | `formatPercent(value: number \| null): string` | Module-level helper (duplicated from `PlacementLegend.tsx`). Returns `"–"` for `null`, otherwise rounds to the nearest percent. |
| `formatScore` | `formatScore(value: number \| null): string` | Module-level helper. Returns `"–"` for `null`, otherwise the value fixed to one decimal place. |
| `sliceColor` | `sliceColor(i: number): string` | Local closure (not memoized). Returns `colors.primary` with the opacity hex suffix from `PLACEMENT_OPACITIES[i]` (falling back to `"44"` for any index beyond the 4 defined steps), used both to build the pie chart's `slices` and passed down to `PlacementLegend` so its swatches match. |

### Derived values

| Value | Type | Computed as |
|---|---|---|
| `isCompact` | `boolean` | `screenWidth < ui.breakpointTablet`, from `useWindowDimensions()` — drives the card's width (`100%` vs `48%` for a 2-up grid) via `makeStyles`. |
| `slices` | `PieSlice[]` | `seat.placementCounts` mapped to `{ value: count, color: sliceColor(i) }`, rebuilt every render. |

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
