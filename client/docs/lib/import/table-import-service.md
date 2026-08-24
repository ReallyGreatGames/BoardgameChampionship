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

### `fetchAndValidate(parsedGroups: ParsedTableGroup[]): Promise<FetchAndValidateResult>`

| Parameter | Type | Description |
|---|---|---|
| `parsedGroups` | `ParsedTableGroup[]` | The per-game groups produced by [`parseTableFile`](table-parser.md) |

Cross-references the parsed groups against the live schedule (games that
have a `gameId`) and the live player list, attaching a per-entry `errors`
list wherever a referenced player code doesn't exist, plus a `globalErrors`
list for a group-count/schedule-count mismatch. Returns everything the
import UI needs to render a validation preview and to drive `importTables`
without a second fetch: the annotated `groups`, `globalErrors`,
`playersByCode` (for reuse by `importTables`), and a `hasErrors` flag.

### `importTables(groups, playersByCode, onStatus, isMounted?): Promise<void>`

| Parameter | Type | Description |
|---|---|---|
| `groups` | `ValidatedGroup[]` | Validated groups from `fetchAndValidate`, to be written |
| `playersByCode` | `Map<string, string>` | Player code → player id, from `fetchAndValidate` |
| `onStatus` | `(groupIndex: number, entryIndex: number, status: ImportRowStatus) => void` | Per-entry progress callback, addressed by position within `groups` |
| `isMounted` | `() => boolean` (optional, defaults to `() => true`) | Polled before each entry; import stops early if it returns `false` |

Writes every entry of every group to the `tables` collection (creating or
updating), reporting per-entry progress via `onStatus`. See "How it works"
below for the create/update matching logic and pacing.

### `ValidatedEntry`

| Property | Type | Description |
|---|---|---|
| `line` | `number` | Source line number, carried through from parsing, for error display |
| `tableNumber` | `number` | The table number parsed from the line |
| `playerCodes` | `string[]` | The 4 player codes parsed from the line |
| `errors` | `string[]` | Validation errors for this line: the parse-time error (if any) plus one message per unknown player code |

### `ValidatedGroup`

| Property | Type | Description |
|---|---|---|
| `gameIndex` | `number` | Position of this group within the file (0-based) |
| `gameTitle` | `string` | Title of the matched schedule entry, or `"Game {n}"` if none matched |
| `gameId` | `string` | The matched schedule entry's `gameId`, or `""` if none matched |
| `entries` | `ValidatedEntry[]` | This group's validated table entries |

### `FetchAndValidateResult`

| Property | Type | Description |
|---|---|---|
| `groups` | `ValidatedGroup[]` | All parsed groups, annotated with validation errors |
| `globalErrors` | `string[]` | File-level problems not tied to one entry (e.g. group/schedule count mismatch) |
| `playersByCode` | `Map<string, string>` | Player code → player id, for reuse by `importTables` |
| `hasErrors` | `boolean` | `true` if any global or per-entry error exists; gates whether the import UI allows importing |

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
setting the new `players` list, with a `sleep(WRITE_PACING_MS)` between
the two writes (not just after the entry) — rather than one direct
overwrite, presumably to avoid an Appwrite relationship-attribute quirk
with replacing a to-many relation's contents in a single write. `isMounted()`
is checked before each entry so an unmounted screen (component navigated
away mid-import) stops issuing further writes. Same retry/pacing strategy
as [`player-import-service.ts`](player-import-service.md) (`retry` +
[`sleep(WRITE_PACING_MS)`](../utils.md), 750ms — the same shared constant
[`wipe-service.ts`](wipe-service.md) paces deletes with), and errors are
reported per-entry via `onStatus` rather than aborting the whole import.

## Used by

- [`lib/components/admin/ImportTables.tsx`](../components/admin/ImportTables.md)

## Related

- [`lib/import/table-parser.ts`](table-parser.md) — produces the `ParsedTableGroup` input
- [`lib/models/table.ts`](../models/table.md)
