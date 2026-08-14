# `lib/components/admin/ImportTables.tsx`

[← lib/components/admin](README.md)

## Purpose

Full wizard for bulk-replacing all table seatings from a pasted/picked
pipe-delimited file — the structural sibling of
[`ImportPlayers.tsx`](ImportPlayers.md), following the same
pick → preview/validate → delete → import → done phase machine, entries
grouped by game instead of by team.

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
