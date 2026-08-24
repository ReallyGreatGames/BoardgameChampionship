# `lib/components/ui/InfoButton.tsx`

[← lib/components/ui](README.md)

## Purpose

Small (i) icon button that opens an info-only [`Dialog`](Dialog.md) (no
cancel button) with a given title/message.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `InfoButton` | `(props: Props): JSX` | Renders a small `(i)` icon `Pressable`; on press, calls `confirm({ title, message, cancelLabel: null })` from [`useDialog`](Dialog.md) to show an info-only dialog. Fire-and-forget — the resolved promise isn't awaited since there's nothing to branch on. |

### Props

| Property | Type | Meaning |
|---|---|---|
| `title` | `string` | Dialog title, passed straight through to `DialogOptions.title`. |
| `message` | `string` | Dialog body text, passed straight through to `DialogOptions.message`. |

## Used by

- [`lib/components/admin/StatisticsTab.tsx`](../admin/StatisticsTab.md)
- [`lib/components/statistics/TeamPerformanceTable.tsx`](../statistics/TeamPerformanceTable.md)
