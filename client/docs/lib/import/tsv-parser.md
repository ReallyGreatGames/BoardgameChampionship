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
