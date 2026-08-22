# `lib/import/wipe-service.ts`

[← lib/import](README.md)

## Purpose

Deletes existing data before a re-import, so importing an updated
teams/players or table-seatings file doesn't leave stale rows behind.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `listAllRows<T>(tableId)` | `(string) => Promise<(T & { $id: string })[]>` | Fetches every row in a table, paging past Appwrite's per-request limit |
| `deleteItems(tableId, items, onStatus, isMounted, kind?)` | `(...) => Promise<void>` | Deletes items one at a time with per-item status, as either Appwrite rows or storage files |
| `listPlayersWipePlan()` | `() => Promise<WipeGroup[]>` | Wipe plan for a teams/players re-import |
| `listTablesWipePlan()` | `() => Promise<WipeGroup[]>` | Wipe plan for a table-seatings re-import |
| `WipeItem` | Type | `{ id, label }` |
| `WipeItemKind` | Type | `"row" \| "file"` |
| `WipeGroup` | Type | `{ key, label, tableId, kind?: WipeItemKind, items: WipeItem[] }` |
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

### `deleteItems(tableId, items, onStatus, isMounted, kind?): Promise<void>`

| Parameter | Type | Description |
|---|---|---|
| `tableId` | `string` | For `kind: "row"`, the Appwrite table/collection id the items belong to; for `kind: "file"`, the storage bucket id |
| `items` | `WipeItem[]` | The rows or files to delete, in order |
| `onStatus` | `(itemId: string, status: WipeItemStatus) => void` | Per-item progress callback |
| `isMounted` | `() => boolean` | Polled before each item; deletion stops early if it returns `false` |
| `kind` | `WipeItemKind` (optional, default `"row"`) | Whether each item is an Appwrite database row (`tablesDB.deleteRow`) or a storage file (`storage.deleteFile`) |

Deletes `items` one at a time from `tableId`, reporting `deleting` then
`success`/`error` per item via `onStatus`. See "How it works" below for the
pacing and not-found handling.

### `listPlayersWipePlan(): Promise<WipeGroup[]>`

No parameters. Builds the confirmation/wipe plan shown before a
teams/players re-import: fetches all teams, tables, timers, timer
seatings, lottery photos, and lottery options, and groups them into six
`WipeGroup`s (`teams`, `tables`, `timers`, `timerSeats`, `lotteryPhotos`,
`lotteryOptions`) for display and subsequent deletion via `deleteItems`.

### `listTablesWipePlan(): Promise<WipeGroup[]>`

No parameters. Builds the confirmation/wipe plan shown before a
table-seatings re-import: fetches all tables, timers, timer seatings,
lottery photos, and lottery options, and groups them into five
`WipeGroup`s (`tables`, `timers`, `timerSeats`, `lotteryPhotos`,
`lotteryOptions`).

### `WipeItem`

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Row or file id to delete |
| `label` | `string` | Human-readable label shown in the wipe confirmation UI |

### `WipeItemKind`

`"row"` (an Appwrite database row, deleted via `tablesDB.deleteRow`) or
`"file"` (a storage file, deleted via `storage.deleteFile`) — determines
which Appwrite API `deleteItems` calls for a group's items, and what
`tableId` means for that group (collection id vs. bucket id).

### `WipeGroup`

| Property | Type | Description |
|---|---|---|
| `key` | `string` | Stable identifier for the group (`"teams"`, `"tables"`, `"timers"`, `"timerSeats"`, `"lotteryPhotos"`, `"lotteryOptions"`) |
| `label` | `string` | Human-readable group heading |
| `tableId` | `string` | The Appwrite table/collection id, or storage bucket id (see `kind`), `deleteItems` should target for this group's items |
| `kind` | `WipeItemKind` (optional, default `"row"`) | Whether this group's items are database rows or storage files |
| `items` | `WipeItem[]` | The rows/files in this group |

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

Deletes items strictly one at a time, paced by
[`WRITE_PACING_MS`](../utils.md) (750ms) between each one, continuing past
individual failures rather than aborting the whole wipe on the first error
— so the group's failures can be reviewed and retried together afterward.
A "row not found" error (`isNotFound`) is treated as **success**, not
failure: some rows (e.g. players) are cascade-deleted by Appwrite when
their parent row (their team) is removed first, so by the time this
function gets to them explicitly they're already gone — which is exactly
the intended outcome. `kind` only changes which Appwrite API is called
(`tablesDB.deleteRow` vs. `storage.deleteFile`); the pacing, retry, and
not-found handling are identical either way, so a `WipeGroup` of lottery
photos flows through the exact same UI (`ImportProgressBar`,
retry-failed-items) as a `WipeGroup` of database rows.

`WRITE_PACING_MS` is a single constant shared with
[`player-import-service.ts`](player-import-service.md) and
[`table-import-service.ts`](table-import-service.md), so a bulk delete
pass and the import pass that follows it are paced identically — deleting
faster than importing (or vice versa) would just move where a rate-limit
error surfaces, not avoid it.

### `listAllLotteryFiles` (internal)

Pages through `storage.listFiles` for the `lottery` bucket the same way
`listAllRows` pages through `tablesDB.listRows` — same `PAGE_SIZE`/offset
loop, just against the storage API instead of the database API.

### `listPlayersWipePlan`

Everything that must be cleared before re-importing teams & players: the
teams themselves (deleting a team cascade-deletes its players via
Appwrite's relationship attribute, so players never need explicit
deletion), every table seating, [`Timer`](../models/timer.md), and
[`TimerSeat`](../models/timer-seat.md) that could reference their (about
to be invalidated) row ids, and every lottery photo and options-lottery
instance — all are per-table/per-game and a fresh roster invalidates what
they refer to (e.g. an options lottery's `LotteryTableResult.table` values
would no longer line up with the newly re-imported table numbering).
`timers` and `timerSeats` are separate collections/groups (see
["Why `Timer` and `TimerSeat` are split"](../models/README.md)) so both
must be wiped explicitly — clearing `timers` alone leaves stale per-seat
state behind.

### `listTablesWipePlan`

Everything that must be cleared before re-importing table seatings: the
seatings themselves, every `Timer`/`TimerSeat` (a reseat can put a
different set of players at a table an existing timer already refers to),
and every lottery photo and options-lottery instance, for the same
stale-table-reference reason as `listPlayersWipePlan`.

## Used by

- [`lib/components/admin/ImportPlayers.tsx`](../components/admin/ImportPlayers.md)
- [`lib/components/admin/ImportTables.tsx`](../components/admin/ImportTables.md)
