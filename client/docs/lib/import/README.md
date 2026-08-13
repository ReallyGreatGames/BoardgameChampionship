# `lib/import`

[← lib](../README.md)

Bulk-import pipeline for admin data entry: pasting a TSV of teams/players or
a pipe-delimited text of table seatings, instead of entering everything by
hand. Each pipeline is split into **parse** (pure, synchronous, testable)
and **import** (async, talks to Appwrite, reports per-row status) stages.

## Files

| File | Purpose |
|---|---|
| [read-text-file.md](read-text-file.md) | Encoding-tolerant text file reader for picked files |
| [tsv-parser.md](tsv-parser.md) | Parses the teams/players TSV format |
| [player-import-service.md](player-import-service.md) | Imports parsed teams/players into Appwrite |
| [table-parser.md](table-parser.md) | Parses the pipe-delimited table-seating format |
| [table-import-service.md](table-import-service.md) | Validates and imports parsed table seatings into Appwrite |
| [wipe-service.md](wipe-service.md) | Deletes existing data before a re-import |

## Used by

Both pipelines are driven from the admin import UI: see
[`lib/components/admin/ImportPlayers.tsx`](../components/admin/ImportPlayers.md)
and [`lib/components/admin/ImportTables.tsx`](../components/admin/ImportTables.md).
