# `lib/models/table.ts`

[← lib/models](README.md)

## Purpose

Appwrite document type `Table` — a table with its assigned players and game.

## Exports

### `type Table`

| Field | Type | Meaning |
|---|---|---|
| `tableNumber` | `number` | Table number |
| `players` | [`Player[]`](player.md) | Assigned players, in seat order — index `i` is seat `i`, the same indexing used by [`Result`](result.md)'s `placements`/`scores`/`signatureIds` arrays and by the timer's seat-indexed state |
| `game` | [`Game`](game.md) | Assigned game |

## Used by

- [`lib/components/results/ResultsAdminTab.tsx`](../components/results/ResultsAdminTab.md)
- [`lib/import/table-import-service.ts`](../import/table-import-service.md)
- [`lib/stores/appwrite/table-store.ts`](../stores/appwrite/table-store.md)
- [`lib/utils/statistics.ts`](../utils/statistics.md)
- [`lib/hooks/useParticipantOverview.ts`](../hooks/useParticipantOverview.md)
