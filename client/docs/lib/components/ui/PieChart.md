# `lib/components/ui/PieChart.tsx`

[← lib/components/ui](README.md)

## Purpose

Minimal SVG pie chart with no external charting library.

## Exports

| Export | Purpose |
|---|---|
| `PieChart` (component) | Props: `{ slices: PieSlice[], size?: number }` (default size 88) |
| `PieSlice` | `{ value: number, color: string }` |

## How it works

Slices are drawn starting at 12 o'clock, clockwise, each as an SVG arc
`Path` sized proportionally to `value / total`. Zero-value slices are
filtered out. If `total <= 0`, renders a plain border-colored circle
instead of an empty chart.

## Used by

- [`lib/components/statistics/SeatCard.tsx`](../statistics/SeatCard.md)
