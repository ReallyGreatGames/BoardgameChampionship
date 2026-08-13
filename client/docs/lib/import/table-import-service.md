# `lib/import/table-import-service.ts`

[← lib/import](README.md)

## Purpose

Validates parsed table seatings ([`ParsedTableGroup`](table-parser.md))
against the current schedule and player list, then imports them into the
`tables` collection.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `fetchAndValidate(parsedGroups)` | `(ParsedTableGroup[]) => Promise<FetchAndValidateResult>` | Matches parsed groups to schedule games and validates player codes |
| `importTables(groups, playersByCode, onStatus, isMounted?)` | `(...) => Promise<void>` | Creates/updates `Table` rows |
| `ValidatedEntry` | Type | `{ line, tableNumber, playerCodes, errors: string[] }` |
| `ValidatedGroup` | Type | `{ gameIndex, gameTitle, gameId, entries: ValidatedEntry[] }` |
| `FetchAndValidateResult` | Type | `{ groups, globalErrors, playersByCode, hasErrors }` |
| `ImportRowStatus` | Type | Same shape as in [`player-import-service.ts`](player-import-service.md) |

## How it works

### `fetchAndValidate`

Loads every schedule entry that has a `gameId` (sorted by `sortIndex`) and
every player (keyed by `playerCode`). Each parsed group is matched to the
schedule entry at the same index — a mismatch in group count vs. schedule
count with a game id becomes a `globalErrors` entry (not fatal, just
surfaced to the user). Every player code referenced by an entry that isn't
found in `playersByCode` becomes a per-entry error. `hasErrors` is `true`
if there are any global or per-entry errors — the import UI uses this to
gate the actual import.

### `importTables`

Loads all existing tables once, then for each entry in each group: resolves
player codes to ids, and either **updates** the matching existing table
(matched by `tableNumber` + `game.$id`) or **creates** a new one. An update
is deliberately done in two steps — first clearing `players: []`, then
setting the new `players` list — rather than one direct overwrite,
presumably to avoid an Appwrite relationship-attribute quirk with
replacing a to-many relation's contents in a single write. `isMounted()` is
checked before each entry so an unmounted screen (component navigated away
mid-import) stops issuing further writes. Same retry/pacing strategy as
[`player-import-service.ts`](player-import-service.md) (`retry` +
`sleep(300)`), and errors are reported per-entry via `onStatus` rather than
aborting the whole import.

## Used by

- [`lib/components/admin/ImportTables.tsx`](../components/admin/ImportTables.md)

## Related

- [`lib/import/table-parser.ts`](table-parser.md) — produces the `ParsedTableGroup` input
- [`lib/models/table.ts`](../models/table.md)
