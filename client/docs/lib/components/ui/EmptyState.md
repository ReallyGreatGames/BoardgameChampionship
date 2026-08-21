# `lib/components/ui/EmptyState.tsx`

[← lib/components/ui](README.md)

## Purpose

Centered placeholder message for empty lists/sections.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `EmptyState` | `(props: Props): JSX` | Renders `message` centered (both axes) in a `flex: 1` container, in muted text. |

### Props

| Property | Type | Meaning |
|---|---|---|
| `message` | `string` | Placeholder text shown to the user. |
| `style` | `ViewStyle?` | Extra style merged onto the outer container. |

## Used by

- [`app/(pages)/(user)/lottery.tsx`](../../../app/(pages)/(user)/lottery.md)
- [`lib/components/admin/RankingsTab.tsx`](../admin/RankingsTab.md), [`StatisticsTab.tsx`](../admin/StatisticsTab.md)
- [`lib/components/results/ResultsAdminTab.tsx`](../results/ResultsAdminTab.md)
- [`lib/components/statistics/TeamPerformanceTable.tsx`](../statistics/TeamPerformanceTable.md)
