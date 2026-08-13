# `lib/models/result.ts`

[← lib/models](README.md)

## Purpose

Appwrite document type `Result` — the result of one table round of a game.

## Exports

### `type Result`

| Field | Type | Meaning |
|---|---|---|
| `gameId` | `string` | Game id |
| `table` | `number` | Table number |
| `note?` | `string` | Free-text note |
| `placements?` | `string[]` | Placements (player ids in order) |
| `scores?` | `number[]` | Scores |
| `signatureIds?` | `string[]` | IDs of the signatures confirming this result |
| `submitted` | `boolean` | Whether the result was finally submitted |

## Used by

- [`lib/components/results/ResultsAdminTab.tsx`](../components/results/ResultsAdminTab.md)
- [`lib/components/results/StateBadge.tsx`](../components/results/StateBadge.md)
- [`lib/components/results/types.ts`](../components/results/types.md)
- [`lib/stores/appwrite/result-store.ts`](../stores/appwrite/result-store.md)
- [`lib/utils/statistics.ts`](../utils/statistics.md)
