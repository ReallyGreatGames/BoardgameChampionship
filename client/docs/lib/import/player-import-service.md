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

### `prefetchExisting(): Promise<{ teamsByCode: Map<string, ExistingTeam>; playersByTeamAndNumber: Map<string, Map<number, string>> }>`

No parameters. Fetches up to 500 rows each from the `teams` and `players`
tables (in parallel) and reshapes them into two lookup maps: `teamsByCode`
maps a team's `code` string to `{ $id, code }`, and
`playersByTeamAndNumber` maps a team's `$id` to a nested `Map<playerNumber,
playerId>`. `ExistingTeam` (`{ $id: string; code: string }`) and
`ExistingPlayer` (`{ $id: string; team: string | { $id: string };
playerNumber: number }`) are internal, non-exported shapes — `team` is
normalized from either a raw id string or an expanded relationship object
before being used as the map key. These maps let `importTeam` match rows
without issuing a query per team/player.

### `importTeam(parsed, teamsByCode, playersByTeamAndNumber, onStatus): Promise<void>`

| Parameter | Type | Description |
|---|---|---|
| `parsed` | `ParsedTeam` | One team + its 4 players, as produced by [`parseTsv`](tsv-parser.md) |
| `teamsByCode` | `Map<string, ExistingTeam>` | Lookup of already-existing teams by `code`, from `prefetchExisting` |
| `playersByTeamAndNumber` | `Map<string, Map<number, string>>` | Lookup of already-existing players by team id → `playerNumber` → player id |
| `onStatus` | `(status: ImportRowStatus) => void` | Callback invoked as this team's row progresses through `importing` → `success`/`error`, for live UI feedback |

Imports (creates or updates) one team and its players, reporting progress
via `onStatus` instead of throwing — see "How it works" below for the
create-vs-update logic, retry/pacing strategy, and error handling. Resolves
once the team and all 4 players have been written (or a failure has been
reported).

### `ImportRowStatus`

A discriminated union describing one row's live import progress:

| Variant | Description |
|---|---|
| `{ state: "pending" }` | Not yet processed |
| `{ state: "importing" }` | Write in progress |
| `{ state: "success" }` | Created/updated successfully |
| `{ state: "error"; message: string }` | Failed; `message` is a human-readable error to display |

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
team's failure doesn't stop the rest of the import). A fixed
[`sleep(WRITE_PACING_MS)`](../utils.md) (750ms) between writes paces
requests to avoid tripping the rate limit in the first place —
`WRITE_PACING_MS` is shared with [`wipe-service.ts`](wipe-service.md) and
[`table-import-service.ts`](table-import-service.md) so a wipe pass and
the import that follows it are throttled the same amount; pacing writes
faster in one phase than the other would just relocate where the
rate-limit error shows up.

## Used by

- [`lib/components/admin/ImportPlayers.tsx`](../components/admin/ImportPlayers.md)

## Related

- [`lib/import/tsv-parser.ts`](tsv-parser.md) — produces the `ParsedTeam` input
- [`lib/import/wipe-service.ts`](wipe-service.md) — clears existing data before a fresh import
