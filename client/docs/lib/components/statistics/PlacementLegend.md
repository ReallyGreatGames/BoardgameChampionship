# `lib/components/statistics/PlacementLegend.tsx`

[← lib/components/statistics](README.md)

## Purpose

Legend rows (one per placement) for [`SeatCard`](SeatCard.md)'s pie chart —
placement rate as a percentage, with the raw count and a color swatch
matching the corresponding pie slice.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `PlacementLegend` (component) | `PlacementLegend({ placementRates, placementCounts, matches, sliceColor }: Props): JSX` | Renders one [`StatRow`](StatRow.md) per placement index, labeled "1st"/"2nd"/etc., showing the placement rate as a percentage plus a `(count/matches)` fraction and a color swatch matching the pie slice for that placement. |

### Props (`Props`)

| Prop | Type | Meaning |
|---|---|---|
| `placementRates` | `(number \| null)[]` | Rate (0–1) of finishing in each placement, indexed by placement (index 0 = 1st); `null` where no rate can be computed (formatted as "–"). |
| `placementCounts` | `number[]` | Raw count of finishes in each placement, indexed the same way as `placementRates`; shown as the numerator of the `(count/matches)` sub-label. |
| `matches` | `number` | Total matches played for this seat; the sub-label (count/matches) is only shown when `matches > 0`. |
| `sliceColor` | `(index: number) => string` | Returns the color for a given placement index, matching the corresponding pie chart slice; used as each row's swatch color. |

### Internal functions

| Function | Signature | Behavior |
|---|---|---|
| `formatPercent` | `formatPercent(value: number \| null): string` | Module-level helper. Returns `"–"` for `null`, otherwise the value rounded to the nearest percent (e.g. `0.5` → `"50%"`). |

## Used by

- [`lib/components/statistics/SeatCard.tsx`](SeatCard.md)
