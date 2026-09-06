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
| `placements?` | `string[]` | Per-seat finishing place, indexed by seat position (not sorted by rank) — `placements[2]` is the place seat 2 finished in, stored as a numeric string (e.g. `"1"`) |
| `scores?` | `number[]` | Per-seat raw score, same seat-position indexing as `placements` |
| `signatureIds?` | `string[]` | Per-seat signature file id (from Appwrite storage), same seat-position indexing as `placements`; a blank/missing entry means that seat hasn't signed yet |
| `submitted` | `boolean` | Whether the result was finally submitted |

All three per-seat arrays are indexed by seat position (0-based, table has a fixed `PLAYER_COUNT` of 4 seats — see `lib/utils/placements.ts`, `lib/utils/statistics.ts`), not by finishing rank; entry `i` in every array describes the same seat, the same seat `i` that indexes [`Table.players`](table.md).

## Used by

- [`lib/components/results/ResultsAdminTab.tsx`](../components/results/ResultsAdminTab.md)
- [`lib/components/results/StateBadge.tsx`](../components/results/StateBadge.md)
- [`lib/components/results/types.ts`](../components/results/types.md)
- [`lib/stores/appwrite/result-store.ts`](../stores/appwrite/result-store.md)
- [`lib/utils/statistics.ts`](../utils/statistics.md)
- [`lib/hooks/useParticipantOverview.ts`](../hooks/useParticipantOverview.md)
