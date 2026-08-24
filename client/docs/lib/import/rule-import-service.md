# `lib/import/rule-import-service.ts`

[← lib/import](README.md)

## Purpose

Matches parsed rule clarifications ([`ParsedRule`](rule-parser.md)) against
a game's existing [`Rule`](../models/rule.md) rows to decide create vs.
update vs. unchanged, optionally deletes all of a game's existing rules
first, then writes the result to the `rules` collection.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `fetchExistingRulesForGame(gameId)` | `(string) => Promise<Rule[]>` | Fetches a game's `Rule` rows fresh from Appwrite, for use as `matchExisting`'s `existingRules` input |
| `matchExisting(parsed, existingRules, gameId)` | `(ParsedRule[], Rule[], string) => RuleImportRow[]` | Annotates each parsed entry with a create/update/unchanged action by title match |
| `importRules(rows, gameId, onStatus, isMounted?)` | `(...) => Promise<void>` | Creates/updates `Rule` rows per `RuleImportRow` |
| `deleteAllRules(rulesToDelete, onStatus, isMounted?)` | `(...) => Promise<void>` | Deletes every given `Rule` row, one at a time, with per-row status |
| `RuleImportRow` | Type | `ParsedRule & { action, existingId?, previousText? }` |
| `RuleImportAction` | Type | `"create" \| "update" \| "unchanged"` |
| `ImportRowStatus` | Type | Same shape as in [`player-import-service.ts`](player-import-service.md) |

### `fetchExistingRulesForGame(gameId: string): Promise<Rule[]>`

| Parameter | Type | Description |
|---|---|---|
| `gameId` | `string` | The game to fetch existing rules for |

`tablesDB.listRows` with `Query.equal("gameId", gameId)` (+ retry/backoff,
same as every other import service). Exists specifically so
[`ImportRules`](../components/admin/ImportRules.md) doesn't feed
`matchExisting` from [`useRuleStore()`](../stores/appwrite/rule-store.md)'s
realtime `collection` — that store only updates once a websocket event
round-trips after a write, so a rule edited moments earlier (in this
session or another) could still read as its pre-edit value there,
producing a false `"unchanged"` match. A direct fetch immediately before
matching guarantees the comparison is against the current server state.

### `matchExisting(parsed: ParsedRule[], existingRules: Rule[], gameId: string): RuleImportRow[]`

| Parameter | Type | Description |
|---|---|---|
| `parsed` | `ParsedRule[]` | Entries from [`parseRulesText`](rule-parser.md) |
| `existingRules` | `Rule[]` | Rules to match against — [`ImportRules`](../components/admin/ImportRules.md) always passes the result of `fetchExistingRulesForGame`, not pre-filtered |
| `gameId` | `string` | The game the parsed entries belong to |

Filters `existingRules` down to `gameId` and indexes them by
lower-cased, trimmed `title`. Each parsed entry is looked up by the same
key: no match → `action: "create"`; a match with identical `type` and
`text` → `action: "unchanged"` (carries `existingId`/`previousText` even
though nothing will be written, so the preview can still show it);
anything else → `action: "update"` (carries `existingId` so `importRules`
knows which row to overwrite, and `previousText` so the preview can show
what's being replaced). An `"unchanged"` row can still be forced through
as a write — see [`ImportRules`](../components/admin/ImportRules.md)'s
"Overriding an unchanged match" — by flipping its `action` to `"update"`
client-side; this function itself never does that.

### `importRules(rows, gameId, onStatus, isMounted?): Promise<void>`

| Parameter | Type | Description |
|---|---|---|
| `rows` | `RuleImportRow[]` | Rows to write, typically from `matchExisting` (or, when the "delete existing first" option is on, from [`ImportRules`](../components/admin/ImportRules.md) with every row forced to `"create"`) |
| `gameId` | `string` | The game the new rows are created under (existing-row updates don't need it — they're addressed by `existingId`) |
| `onStatus` | `(index: number, status: ImportRowStatus) => void` | Per-row progress callback, addressed by position in `rows` |
| `isMounted` | `() => boolean` (optional, defaults to `() => true`) | Polled before each row; stops early if it returns `false` |

For each row: `"unchanged"` rows are reported `"success"` immediately with
no write at all; `"update"` rows call `tablesDB.updateRow` on
`row.existingId`; `"create"` rows call `tablesDB.createRow` with a fresh
`ID.unique()` id. Same retry-on-rate-limit + `sleep(WRITE_PACING_MS)`
pacing between writes as the other import services (see
[`player-import-service.ts`](player-import-service.md)).

### `deleteAllRules(rulesToDelete, onStatus, isMounted?): Promise<void>`

| Parameter | Type | Description |
|---|---|---|
| `rulesToDelete` | `Rule[]` | The rows to delete, e.g. every existing rule for the selected game |
| `onStatus` | `(index: number, status: ImportRowStatus) => void` | Per-row progress callback, addressed by position in `rulesToDelete` |
| `isMounted` | `() => boolean` (optional, defaults to `() => true`) | Polled before each row; stops early if it returns `false` |

Deletes each row by `$id` via `tablesDB.deleteRow`, same
retry/pacing/status-callback shape as `importRules`. Unlike
[`wipe-service.ts`](wipe-service.md) this isn't a multi-collection wipe
plan — it only ever targets the `rules` table, scoped to whatever rows the
caller passes in (normally one game's rules).

### `RuleImportRow`

| Property | Type | Description |
|---|---|---|
| `title` / `type` / `text` | see [`ParsedRule`](rule-parser.md) | Carried through from parsing, editable in the preview UI before import |
| `action` | `RuleImportAction` | What `importRules` will do with this row |
| `existingId` | `string \| undefined` | The matched existing row's `$id`, set for `"update"`/`"unchanged"` |
| `previousText` | `string \| undefined` | The matched existing row's prior `text`, set for `"update"`/`"unchanged"`, shown in the preview as a diff hint |

## Used by

- [`lib/components/admin/ImportRules.tsx`](../components/admin/ImportRules.md)

## Related

- [`lib/import/rule-parser.ts`](rule-parser.md) — produces the `ParsedRule` input
- [`lib/models/rule.ts`](../models/rule.md)
- [`lib/stores/appwrite/rule-store.ts`](../stores/appwrite/rule-store.md) — the realtime store `fetchExistingRulesForGame` deliberately bypasses for matching (see above); still used elsewhere in `ImportRules` for the informational existing-rule count
