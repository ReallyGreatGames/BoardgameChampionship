# `lib/import/player-import-service.ts`

[← lib/import](README.md)

## Purpose

Imports parsed teams/players ([`ParsedTeam`](tsv-parser.md)) into Appwrite,
creating or updating rows as needed, one team at a time with per-row status
reporting.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `prefetchExisting()` | `() => Promise<{ teamsByCode, playersByTeamAndNumber }>` | Loads all existing teams/players once, for matching |
| `importTeam(parsed, teamsByCode, playersByTeamAndNumber, onStatus)` | `(...) => Promise<void>` | Imports one team + its players |
| `ImportRowStatus` | Type | `{ state: "pending" \| "importing" \| "success" } \| { state: "error"; message: string }` |

## How it works

`prefetchExisting` loads every existing team (keyed by `code`) and every
existing player (keyed by `teamId` → `playerNumber` → `$id`) up front, so
`importTeam` can look up matches without a query per row.

`importTeam`: matches the parsed team against `teamsByCode` — if found,
updates `name`/`country` on the existing row; otherwise creates a new team.
Then, for each parsed player, matches against
`playersByTeamAndNumber.get(teamId)` by `playerNumber` — updates the
existing player's `name`/`playerCode` if found, otherwise creates a new
one. `playerCode` is always rebuilt as `${teamCode}-${playerNumber}` (not
read back from any existing row), so it stays in sync if the team code changes.

Every Appwrite call is wrapped in `retry`, which uses
[`withRetry`](../utils.md) with `shouldRetry: isRateLimit` — only HTTP 429 /
"rate limit" errors are retried (with exponential backoff); other errors
propagate immediately and are caught by `importTeam`, which reports them
via `onStatus({ state: "error", message })` instead of throwing (so one
team's failure doesn't stop the rest of the import). A fixed `sleep(300)`
between writes paces requests to avoid tripping the rate limit in the
first place.

## Used by

- [`lib/components/admin/ImportPlayers.tsx`](../components/admin/ImportPlayers.md)

## Related

- [`lib/import/tsv-parser.ts`](tsv-parser.md) — produces the `ParsedTeam` input
- [`lib/import/wipe-service.ts`](wipe-service.md) — clears existing data before a fresh import
