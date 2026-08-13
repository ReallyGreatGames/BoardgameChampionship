# `lib/import/wipe-service.ts`

[← lib/import](README.md)

## Purpose

Deletes existing data before a re-import, so importing an updated
teams/players or table-seatings file doesn't leave stale rows behind.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `listAllRows<T>(tableId)` | `(string) => Promise<(T & { $id: string })[]>` | Fetches every row in a table, paging past Appwrite's per-request limit |
| `deleteItems(tableId, items, onStatus, isMounted)` | `(...) => Promise<void>` | Deletes items one at a time with per-item status |
| `listPlayersWipePlan()` | `() => Promise<WipeGroup[]>` | Wipe plan for a teams/players re-import |
| `listTablesWipePlan()` | `() => Promise<WipeGroup[]>` | Wipe plan for a table-seatings re-import |
| `WipeItem` | Type | `{ id, label }` |
| `WipeGroup` | Type | `{ key, label, tableId, items: WipeItem[] }` |
| `WipeItemStatus` | Type | `{ state: "pending" \| "deleting" \| "success" } \| { state: "error"; message: string }` |

## How it works

### `listAllRows`

Pages through `tablesDB.listRows` in batches of 500 (`PAGE_SIZE`) until a
page comes back shorter than the page size.

### `deleteItems`

Deletes items strictly one at a time (paced by `DELETE_PACING_MS`, 300ms),
continuing past individual failures rather than aborting the whole wipe on
the first error — so the group's failures can be reviewed and retried
together afterward. A "row not found" error (`isNotFound`) is treated as
**success**, not failure: some rows (e.g. players) are cascade-deleted by
Appwrite when their parent row (their team) is removed first, so by the
time this function gets to them explicitly they're already gone — which is
exactly the intended outcome.

### `listPlayersWipePlan`

Everything that must be cleared before re-importing teams & players: the
teams themselves (deleting a team cascade-deletes its players via
Appwrite's relationship attribute, so players never need explicit
deletion), plus every table seating and timer that could reference their
(about to be invalidated) row ids.

### `listTablesWipePlan`

Everything that must be cleared before re-importing table seatings: the
seatings themselves, plus every timer (a reseat can put a different set of
players at a table an existing timer already refers to).

## Used by

- [`lib/components/admin/ImportPlayers.tsx`](../components/admin/ImportPlayers.md)
- [`lib/components/admin/ImportTables.tsx`](../components/admin/ImportTables.md)
