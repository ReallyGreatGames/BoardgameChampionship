# `lib/components/statistics/PlacementLegend.tsx`

[← lib/components/statistics](README.md)

## Purpose

Legend rows (one per placement) for [`SeatCard`](SeatCard.md)'s pie chart —
placement rate as a percentage, with the raw count and a color swatch
matching the corresponding pie slice.

## Props

`{ placementRates: (number | null)[], placementCounts: number[], matches: number, sliceColor: (index: number) => string }`

## Used by

- [`lib/components/statistics/SeatCard.tsx`](SeatCard.md)
