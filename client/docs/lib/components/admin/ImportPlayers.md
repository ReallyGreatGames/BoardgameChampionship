# `lib/components/admin/ImportPlayers.tsx`

[← lib/components/admin](README.md)

## Purpose

Full wizard for bulk-replacing all teams and players from a pasted/picked
TSV file: pick → preview/validate → delete existing data → import → done,
each step with per-row status and retry.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `ImportPlayers` | `(): JSX.Element` | No props. The whole wizard; renders one of the pick/deleting/preview-importing-done views based on local `phase` state. |

### Internal types

| Type | Shape | Meaning |
|---|---|---|
| `Phase` | `"pick" \| "preview" \| "deleting" \| "importing" \| "done"` | Which screen is rendered; see [Phase state machine](#phase-state-machine) below. |
| `WipeStatusMap` | `Record<string, Record<string, WipeItemStatus>>` | Per-wipe-group, per-item delete status, keyed `[group.key][item.id]`. |

### Internal functions

| Function | Signature | Behavior |
|---|---|---|
| `initWipeStatuses` | `(groups: WipeGroup[]): WipeStatusMap` | Seeds every item in every wipe group to `{ state: "pending" }` before deletion starts. |
| `allWipeItemsSucceeded` | `(statuses: WipeStatusMap, groups: WipeGroup[]): boolean` | True only if every item in every group has status `"success"`; gates whether `runImport` is allowed to proceed after a wipe pass. |
| `handlePickFile` | `(): Promise<void>` | Opens the document picker for `.tsv`/`.txt`/`.csv`, reads the picked file via [`readTextFile`](../../import/read-text-file.md), parses it with [`parseTsv`](../../import/tsv-parser.md), seeds `statuses` to `"pending"` per row, and advances `phase` to `"preview"`. Sets `pickError` on failure or a no-op cancel. |
| `runWipeGroup` | `(group: WipeGroup, local: WipeStatusMap): Promise<void>` | Marks `group` as the `activeWipeGroup`, then calls [`deleteItems`](../../import/wipe-service.md) for it, updating `local` and `wipeStatuses` per item as each delete resolves. The third argument to `deleteItems` is a "should continue" predicate checking `mountedRef`/`cancelRequestedRef` between items; the fifth is `group.kind`, so a lottery-photos group deletes storage files instead of database rows without this function needing to know the difference. |
| `cancelDeleting` | `(): void` | Sets `cancelRequestedRef.current = true` and rewrites every still-`"pending"` wipe item's status to `{ state: "error", message: "Cancelled" }`, so a cancelled delete pass reads identically to a failed one and can be retried the same way. |
| `cancelImporting` | `(): void` | Same idea for the import pass: flags cancellation, marks every still-`"pending"` row status as a `"Cancelled"` error, and jumps `phase` straight to `"done"`. |
| `runImport` | `(): Promise<void>` | Sets `phase` to `"importing"`, calls [`prefetchExisting`](../../import/player-import-service.md) once to build lookup maps, then iterates `rows` sequentially calling [`importTeam`](../../import/player-import-service.md) per row (stopping early on unmount or cancellation), updating that row's entry in `statuses` via the per-row status callback. Sets `phase` to `"done"` when finished. |
| `retryFailedImports` | `(): Promise<void>` | Recomputes the indexes of rows whose status is `"error"`, re-runs `prefetchExisting` and `importTeam` for just those rows (same loop shape as `runImport`, restricted to the failed subset). No-ops if nothing failed. |
| `handleImportClick` | `(): Promise<void>` | The entry point for "Import N teams": shows one destructive confirmation dialog, then on confirm calls [`listPlayersWipePlan`](../../import/wipe-service.md), seeds wipe state, sets `phase` to `"deleting"`, and runs each wipe group in sequence via `runWipeGroup`. If `allWipeItemsSucceeded` afterward, chains straight into `runImport`. |
| `retryWipeGroup` | `(groupKey: string): Promise<void>` | Re-runs `runWipeGroup` for just the failed items within one named group; if that leaves every group fully succeeded, chains into `runImport` the same as `handleImportClick` does. |
| `handleImportAnyway` | `(): Promise<void>` | Bypasses the wipe-success gate and calls `runImport` directly — used when the admin explicitly accepts importing over incomplete cleanup. |
| `handleReset` | `(): void` | Clears every piece of wizard state (`rows`, `statuses`, `pickError`, wipe state) and returns `phase` to `"pick"`, for starting over with a new file. |
| `StatusIcon` | `({ status: ImportRowStatus; styles; primaryColor: string }): JSX.Element` | Local row-status glyph: blank placeholder while pending, spinner while importing, checkmark on success, cross on error. |

## How it works

### Phase state machine

`phase: "pick" | "preview" | "deleting" | "importing" | "done"` drives
which screen renders. `mountedRef`/`cancelRequestedRef` let every async
loop check, between steps, whether the component has unmounted or the user
cancelled — both stop the loop from continuing to touch state after it's
no longer safe to.

### Blocking navigation mid-run

An effect sets [`useImportActivity()`](ImportActivityContext.md)'s `busy`
flag while `phase` is `"deleting"` or `"importing"` — see that context's
docs for why (unmounting mid-run silently aborts it).

### Pick → parse

[`readTextFile`](../../import/read-text-file.md) handles encoding quirks,
[`parseTsv`](../../import/tsv-parser.md) turns the text into `ParsedRow[]`.
Rows with parse errors are still shown in preview (flagged), and the
"Import" button is disabled until every row is error-free.

### Delete-then-import as one committed action

`handleImportClick` shows one strongly-worded confirmation (destructive,
irreversible), then runs [`listPlayersWipePlan`](../../import/wipe-service.md)
and works through each wipe group sequentially
(`runWipeGroup`/[`deleteItems`](../../import/wipe-service.md)), tracking
per-item status per group in a `WipeStatusMap`. Only if
`allWipeItemsSucceeded` does it proceed to `runImport`
([`importTeam`](../../import/player-import-service.md) per row, via
[`prefetchExisting`](../../import/player-import-service.md) once up front) —
if any deletions failed, the admin can either retry just the failed items
per group (`retryWipeGroup`) or explicitly bypass and import anyway
(`handleImportAnyway`), rather than the import silently proceeding over
incomplete cleanup.

### Cancellation vs. failure

`cancelDeleting`/`cancelImporting` mark every still-`"pending"` item as a
`"Cancelled"` error rather than leaving them pending forever — so a
cancelled run's state is visually indistinguishable from "some items
failed," and can be retried the same way.

## Used by

- [`lib/components/admin/ImportTab.tsx`](ImportTab.md)

## Related

- [`lib/import/`](../../import/README.md) — all the actual parsing/import/wipe logic
- [`lib/components/admin/ImportTables.tsx`](ImportTables.md) — the near-identical sibling wizard for table seatings
