# `lib/import/table-parser.ts`

[← lib/import](README.md)

## Purpose

Parses the pipe-delimited table-seating import format (one line per table,
grouped by game) into structured entries. Pure, synchronous, no Appwrite access.

## Exports

| Export | Type | Meaning |
|---|---|---|
| `parseTableFile(raw: string): TableParseResult` | Function | Parses the whole file into groups |
| `ParsedTableEntry` | Type | `{ line, tableNumber, playerCodes, error }` |
| `ParsedTableGroup` | Type | `{ gameIndex, entries: ParsedTableEntry[] }` |
| `TableParseResult` | Type | `{ groups: ParsedTableGroup[] }` |

### `parseTableFile(raw: string): TableParseResult`

| Parameter | Type | Description |
|---|---|---|
| `raw` | `string` | The full contents of the table-seating import file, as read by [`readTextFile`](read-text-file.md) |

Splits `raw` into non-blank lines, parses each with the internal
`parseLine` helper, and buckets consecutive lines into `ParsedTableGroup`s
(see "Grouping by game" below). Never throws — malformed lines are kept
with a populated `error` field rather than being dropped, so the caller can
render every line's status. Returns all groups wrapped in a
`TableParseResult`.

### `ParsedTableEntry`

| Property | Type | Description |
|---|---|---|
| `line` | `number` | 1-based source line number, for error display |
| `tableNumber` | `number` | Parsed table number (`0` if parsing failed) |
| `playerCodes` | `string[]` | The player codes found after the table number (expected to be exactly 4) |
| `error` | `string \| null` | Human-readable parse error for this line, or `null` if the line parsed cleanly |

### `ParsedTableGroup`

| Property | Type | Description |
|---|---|---|
| `gameIndex` | `number` | Position of this group within the file (0-based) |
| `entries` | `ParsedTableEntry[]` | The table entries belonging to this game |

### `TableParseResult`

| Property | Type | Description |
|---|---|---|
| `groups` | `ParsedTableGroup[]` | Every game group found in the file, in file order |

## How it works

Each line is expected as `<anything> | <tableNumber> <code1> <code2> <code3> <code4>`
— everything before the first `|` is ignored (e.g. a game title comment),
and the part after is split on whitespace into the table number followed
by exactly 4 player codes. Missing the separator, a missing/non-numeric
table number, or a player-code count other than 4 all produce a
per-line `error` string instead of throwing — parsing always succeeds and
returns best-effort data, letting the caller decide how to surface errors.

**Grouping by game**: there's no explicit game marker in the file — a new
group starts whenever a line's table number is **less than or equal to**
the previous line's table number, i.e. table numbers are expected to
increase monotonically within one game's block and reset (or repeat) at
the start of the next.

## Used by

- [`lib/components/admin/ImportTables.tsx`](../components/admin/ImportTables.md)
- [`lib/import/table-import-service.ts`](table-import-service.md)
