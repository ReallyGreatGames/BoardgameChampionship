# `lib/import`

[← lib](../README.md)

Bulk-import pipeline for admin data entry: pasting a TSV of teams/players, a
pipe-delimited text of table seatings, or a game's published rule
clarifications, instead of entering everything by hand. Each pipeline is
split into **parse** (pure, synchronous, testable) and **import** (async,
talks to Appwrite, reports per-row status) stages.

## Files

| File | Purpose |
|---|---|
| [read-text-file.md](read-text-file.md) | Encoding-tolerant text file reader for picked files |
| [tsv-parser.md](tsv-parser.md) | Parses the teams/players TSV format |
| [player-import-service.md](player-import-service.md) | Imports parsed teams/players into Appwrite |
| [table-parser.md](table-parser.md) | Parses the pipe-delimited table-seating format |
| [table-import-service.md](table-import-service.md) | Validates and imports parsed table seatings into Appwrite |
| [rule-parser.md](rule-parser.md) | Parses pasted rule-clarification text (English/German) into rule entries |
| [rule-import-service.md](rule-import-service.md) | Matches parsed rules to existing ones and imports/deletes them into Appwrite |
| [wipe-service.md](wipe-service.md) | Deletes existing data before a re-import (multi-collection wipe plans for the players/tables pipelines) |

## Used by

All three pipelines are driven from the admin import UI: see
[`lib/components/admin/ImportPlayers.tsx`](../components/admin/ImportPlayers.md),
[`lib/components/admin/ImportTables.tsx`](../components/admin/ImportTables.md),
and [`lib/components/admin/ImportRules.tsx`](../components/admin/ImportRules.md).
