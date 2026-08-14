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
