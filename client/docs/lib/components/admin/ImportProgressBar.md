# `lib/components/admin/ImportProgressBar.tsx`

[← lib/components/admin](README.md)

## Purpose

Shared progress bar for both import wizards: a two-color (success/error)
fill track, a count summary, and an optional retry button + per-item error list.

## Exports

| Export | Purpose |
|---|---|
| `ImportProgressBar` (component) | Props: `{ label, total, succeeded, failedItems, active, onRetry? }` |
| `FailedItem` | `{ id, label, message }` |

## Used by

- [`lib/components/admin/ImportPlayers.tsx`](ImportPlayers.md)
- [`lib/components/admin/ImportTables.tsx`](ImportTables.md)
