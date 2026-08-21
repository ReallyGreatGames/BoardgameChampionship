# `lib/components/ui/PieChart.tsx`

[← lib/components/ui](README.md)

## Purpose

Minimal SVG pie chart with no external charting library.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `PieChart` | `(props: Props): JSX` | Renders an `Svg` containing one arc `Path` per non-zero slice, or a plain border-colored `Circle` when there's nothing to chart. |
| `PieSlice` | `{ value: number, color: string }` | One wedge: its `value` determines the wedge's angular share, `color` its fill. |

### Props

| Property | Type | Meaning |
|---|---|---|
| `slices` | `PieSlice[]` | The wedges to draw. |
| `size` | `number?` | Width/height of the square SVG canvas in pixels; defaults to `88`. |

## How it works

Slices are drawn starting at 12 o'clock, clockwise, each as an SVG arc
`Path` sized proportionally to `value / total`. Zero-value slices are
filtered out. If `total <= 0`, renders a plain border-colored circle
instead of an empty chart.

### `polarToCartesian(cx: number, cy: number, r: number, angle: number): { x: number; y: number }`

Converts a point on a circle of center `(cx, cy)` and radius `r`, at
`angle` radians (measured from the positive x-axis), into `{ x, y }`
Cartesian coordinates. Used to find the start/end points of each wedge's arc.

### `slicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string`

Builds an SVG path `d` string for one pie wedge: a line from the center to
the arc's start point, an arc from `startAngle` to `endAngle`, and back to
center (`Z`). `largeArc` is set to `1` when the wedge spans more than
π radians (half the circle), which SVG's arc command needs to pick the
correct one of the two possible arcs between the two points.

### `paths` (`useMemo`)

Recomputed only when `[slices, total, cx, cy, r]` change. Starts `angle` at
`-Math.PI / 2` (12 o'clock, since SVG angle 0 is 3 o'clock) and walks
through non-zero slices in order, accumulating `angle` by each slice's
proportional sweep (`value / total * 2π`) so wedges are laid out
contiguously clockwise with no gaps or overlaps.

## Used by

- [`lib/components/statistics/SeatCard.tsx`](../statistics/SeatCard.md)
