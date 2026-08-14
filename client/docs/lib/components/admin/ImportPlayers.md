# `lib/components/admin/ImportPlayers.tsx`

[← lib/components/admin](README.md)

## Purpose

Full wizard for bulk-replacing all teams and players from a pasted/picked
TSV file: pick → preview/validate → delete existing data → import → done,
each step with per-row status and retry.

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
