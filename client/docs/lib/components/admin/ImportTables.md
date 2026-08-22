# `lib/components/admin/ImportTables.tsx`

[← lib/components/admin](README.md)

## Purpose

Full wizard for bulk-replacing all table seatings from a pasted/picked
pipe-delimited file — the structural sibling of
[`ImportPlayers.tsx`](ImportPlayers.md), following the same
pick → preview/validate → delete → import → done phase machine, entries
grouped by game instead of by team.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `ImportTables` | `(): JSX.Element` | No props. The table-seating counterpart to [`ImportPlayers`](ImportPlayers.md); same phase machine, entries grouped by game instead of by team. |

### Internal types

| Type | Shape | Meaning |
|---|---|---|
| `Phase` | `"pick" \| "preview" \| "deleting" \| "importing" \| "done"` | Same five-phase machine as `ImportPlayers`. |
| `WipeStatusMap` | `Record<string, Record<string, WipeItemStatus>>` | Per-wipe-group, per-item delete status, keyed `[group.key][item.id]` (identical shape to `ImportPlayers`). |

### Internal functions

| Function | Signature | Behavior |
|---|---|---|
| `initWipeStatuses` | `(groups: WipeGroup[]): WipeStatusMap` | Seeds every wipe item to `{ state: "pending" }`. Identical to `ImportPlayers`'s helper of the same name. |
| `allWipeItemsSucceeded` | `(statuses: WipeStatusMap, groups: WipeGroup[]): boolean` | True only if every item in every group succeeded; gates whether `runImport` proceeds. |
| `handlePickFile` | `(): Promise<void>` | Opens the picker (`text/plain`/`*/*`), reads the file, parses it with [`parseTableFile`](../../import/table-parser.md), then awaits [`fetchAndValidate`](../../import/table-import-service.md) against the schedule (shows a loading spinner on the pick button while that network round-trip runs). Seeds a `statuses[group][entry]` grid of `"pending"` and advances to `"preview"`. |
| `runWipeGroup` | `(group: WipeGroup, local: WipeStatusMap): Promise<void>` | Same as `ImportPlayers`: marks the group active, deletes via [`deleteItems`](../../import/wipe-service.md) (passing `group.kind` so lottery-photo groups delete storage files rather than database rows), streaming per-item status updates while `mountedRef`/`cancelRequestedRef` allow it. |
| `cancelDeleting` | `(): void` | Flags cancellation and turns every still-pending wipe item into a `"Cancelled"` error. |
| `cancelImporting` | `(): void` | Flags cancellation, turns every still-pending entry (across the two-dimensional `statuses` grid) into a `"Cancelled"` error, and jumps `phase` to `"done"`. |
| `runImport` | `(): Promise<void>` | No-ops if `validation` is null. Sets `phase` to `"importing"` and calls [`importTables`](../../import/table-import-service.md) once for every validated group, with a `(g, e, status)` callback that writes into `statuses[g][e]` — `g`/`e` are the group and entry indexes, matching the grid shape. A continuation predicate stops the run early on unmount or cancellation. |
| `retryFailedEntriesInGroup` | `(g: number): Promise<void>` | Builds a `ValidatedGroup` containing only group `g`'s failed entries (`failedEntryIndices`), then calls `importTables` with just that one-group array. Because `importTables` reports positions relative to the filtered subset, the status callback maps its `re` (retry-entry index) back to the original `e` via `failedEntryIndices[re]` before writing into `statuses[g][e]`. |
| `handleImportClick` | `(): Promise<void>` | Confirms destructively, then calls [`listTablesWipePlan`](../../import/wipe-service.md), seeds wipe state, sets `phase` to `"deleting"`, and works through each wipe group in sequence. Chains into `runImport` if `allWipeItemsSucceeded`. |
| `retryWipeGroup` | `(groupKey: string): Promise<void>` | Re-runs `runWipeGroup` for one group's failed items only; chains into `runImport` once every group is fully succeeded. |
| `handleImportAnyway` | `(): Promise<void>` | Bypasses the wipe-success gate and calls `runImport` directly. |
| `handleReset` | `(): void` | Clears `loading`, `pickError`, `validation`, `statuses`, and wipe state, returning `phase` to `"pick"`. |
| `GameGroup` | `({ group: ValidatedGroup; statuses: ImportRowStatus[]; styles; primaryColor: string }): JSX.Element` | Local component rendering one game's header, column labels, and entry rows (each with its own `StatusIcon` and inline error list) as a section within the shared scroll view. |
| `StatusIcon` | `({ status: ImportRowStatus; styles; primaryColor: string }): JSX.Element` | Same blank/spinner/check/cross glyph logic as in `ImportPlayers`, duplicated locally rather than shared. |

## How it works

Shares essentially all of [`ImportPlayers`](ImportPlayers.md)'s
mechanics (`mountedRef`/`cancelRequestedRef`, the `busy` flag via
[`useImportActivity`](ImportActivityContext.md), the delete-then-import
gate via `allWipeItemsSucceeded`, cancellation-as-error) — the differences
are specific to this domain:

- **Parsing/validation** goes through
  [`parseTableFile`](../../import/table-parser.md) then
  [`fetchAndValidate`](../../import/table-import-service.md), which
  matches parsed game-groups against the actual schedule and flags unknown
  player codes; a group-count mismatch against the schedule becomes a
  `globalErrors` entry shown above the table list.
- **Status is two-dimensional** (`ImportRowStatus[][]`, indexed by
  `[group][entry]`) rather than a flat array, since entries are grouped by game.
- **Retry granularity**: `retryFailedEntriesInGroup(g)` retries only the
  failed entries within one specific game's group, re-mapping indices back
  via `failedEntryIndices` since [`importTables`](../../import/table-import-service.md)
  is called with just the filtered subset.
- `GameGroup` (local component) renders one game's entries as its own
  labeled table section within the shared scroll view.

## Used by

- [`lib/components/admin/ImportTab.tsx`](ImportTab.md)

## Related

- [`lib/import/`](../../import/README.md)
- [`lib/components/admin/ImportPlayers.tsx`](ImportPlayers.md)
