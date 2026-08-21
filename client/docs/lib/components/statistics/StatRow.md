# `lib/components/statistics/StatRow.tsx`

[← lib/components/statistics](README.md)

## Purpose

Generic compact label/value line — optionally with an identity color
swatch and a muted parenthetical sub-value.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `StatRow` (component) | `StatRow({ label, value, sub, swatchColor }: Props): JSX` | Renders one row: an optional color swatch, a single-line label, and a single-line value with an optional muted parenthetical sub-value appended. |

### Props (`Props`)

| Prop | Type | Meaning |
|---|---|---|
| `label` | `string` | The stat's name, shown at a fixed width on the left (truncated to one line). |
| `value` | `string` | The stat's formatted value, right-aligned. |
| `sub` | `string \| undefined` | Optional muted text appended after `value` (e.g. a raw count like `(3/10)`); omitted entirely when not given. |
| `swatchColor` | `string \| undefined` | Optional background color for the small square swatch preceding the label; the swatch renders transparent/unstyled when omitted. |

## Used by

- [`lib/components/statistics/PlacementLegend.tsx`](PlacementLegend.md)
- [`lib/components/statistics/SeatCard.tsx`](SeatCard.md)
