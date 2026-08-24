# `lib/import/tsv-parser.ts`

[← lib/import](README.md)

## Purpose

Parses the tab-separated teams/players import format into structured rows.
Pure, synchronous, no Appwrite access.

## Exports

| Export | Type | Meaning |
|---|---|---|
| `parseTsv(raw: string): ParsedRow[]` | Function | Parses the whole file |
| `ParsedPlayer` | Type | `{ name, playerNumber }` |
| `ParsedTeam` | Type | `{ name, country, code, players: ParsedPlayer[] }` |
| `ParsedRow` | Type | `{ line, team: ParsedTeam, errors: string[] }` |

### `parseTsv(raw: string): ParsedRow[]`

| Parameter | Type | Description |
|---|---|---|
| `raw` | `string` | The full contents of the teams/players TSV import file, as read by [`readTextFile`](read-text-file.md) |

Splits `raw` into non-blank lines, auto-detects and skips a header row (see
"How it works" below), and parses each remaining line into a `ParsedRow`
via the internal `parseRow` helper. Never throws — a short or malformed
line still produces a `ParsedRow` with best-effort data and populated
`errors`, so every line can be shown to the user with its own status.

### `ParsedPlayer`

| Property | Type | Description |
|---|---|---|
| `name` | `string` | Player's display name, from one of columns 2-5 |
| `playerNumber` | `number` | 1-based seat/player number within the team (always 1-4) |

### `ParsedTeam`

| Property | Type | Description |
|---|---|---|
| `name` | `string` | Team name (column 0) |
| `country` | `string` | 2-letter country code (column 7), defaulting to `"DE"` if absent/blank |
| `code` | `string` | Team code (column 6), used elsewhere to build `playerCode` (`${code}-${playerNumber}`) |
| `players` | `ParsedPlayer[]` | Always exactly 4 entries, one per player column, in order |

### `ParsedRow`

| Property | Type | Description |
|---|---|---|
| `line` | `number` | 1-based source line number, for error display |
| `team` | `ParsedTeam` | The parsed team + players for this line (best-effort even on error) |
| `errors` | `string[]` | Human-readable validation messages: too few columns, missing team name/code, missing player name(s) |

## How it works

Expects tab-separated columns: `name`, (unused col 1), 4 player names
(cols 2-5), team `code` (col 6), and an optional 2-letter country code
(col 7) — some "MANNSCHAFTEN" exports omit column 7 entirely or leave it
blank, both defaulting to `"DE"` (`DEFAULT_COUNTRY`).

A header row is auto-detected and skipped: `parseTsv` checks whether column
6 of the first line is blank/whitespace or literally the word `"code"`, and
if so starts parsing from line 2 instead.

Rows with fewer than 7 columns, a missing team name/code, or a missing
player name are still parsed (returning best-effort data) but collect
human-readable messages in `errors` — the caller
([`player-import-service.ts`](player-import-service.md) via the admin UI)
decides how to surface those, rather than this module throwing.

## Used by

- [`lib/components/admin/ImportPlayers.tsx`](../components/admin/ImportPlayers.md)
- [`lib/import/player-import-service.ts`](player-import-service.md)
