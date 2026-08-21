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

### `listAllRows<T>(tableId: string): Promise<(T & { $id: string })[]>`

| Parameter | Type | Description |
|---|---|---|
| `tableId` | `string` | The Appwrite table/collection id to fully page through (e.g. `"teams"`, `"tables"`, `"timers"`) |

Generic helper that repeatedly calls `tablesDB.listRows` with `Query.limit`
+ `Query.offset`, advancing the offset by `PAGE_SIZE` (500) each iteration
until a page comes back with fewer than `PAGE_SIZE` rows. Returns every row
in the table (typed as `T` plus the Appwrite `$id` field), regardless of
how many pages that takes.

### `deleteItems(tableId, items, onStatus, isMounted): Promise<void>`

| Parameter | Type | Description |
|---|---|---|
| `tableId` | `string` | The Appwrite table/collection id the items belong to |
| `items` | `WipeItem[]` | The rows to delete, in order |
| `onStatus` | `(itemId: string, status: WipeItemStatus) => void` | Per-item progress callback |
| `isMounted` | `() => boolean` | Polled before each item; deletion stops early if it returns `false` |

Deletes `items` one at a time from `tableId`, reporting `deleting` then
`success`/`error` per item via `onStatus`. See "How it works" below for the
pacing and not-found handling.

### `listPlayersWipePlan(): Promise<WipeGroup[]>`

No parameters. Builds the confirmation/wipe plan shown before a teams/players
re-import: fetches all teams, tables, and timers, and groups them into three
`WipeGroup`s (`teams`, `tables`, `timers`) for display and subsequent
deletion via `deleteItems`.

### `listTablesWipePlan(): Promise<WipeGroup[]>`

No parameters. Builds the confirmation/wipe plan shown before a
table-seatings re-import: fetches all tables and timers and groups them
into two `WipeGroup`s (`tables`, `timers`).

### `WipeItem`

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Row id to delete |
| `label` | `string` | Human-readable label shown in the wipe confirmation UI |

### `WipeGroup`

| Property | Type | Description |
|---|---|---|
| `key` | `string` | Stable identifier for the group (`"teams"`, `"tables"`, `"timers"`) |
| `label` | `string` | Human-readable group heading |
| `tableId` | `string` | The Appwrite table/collection id `deleteItems` should target for this group's items |
| `items` | `WipeItem[]` | The rows in this group |

### `WipeItemStatus`

A discriminated union describing one item's live deletion progress —
`{ state: "pending" }`, `{ state: "deleting" }`, `{ state: "success" }`, or
`{ state: "error"; message: string }` — mirroring `ImportRowStatus` in the
other import-service modules.

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
