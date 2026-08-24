# `lib/stores/real-time-store.ts`

[← lib/stores](README.md)

## Purpose

The shared engine behind every store in
[`lib/stores/appwrite/`](appwrite/README.md): generic CRUD helpers against
Appwrite's `tablesDB`/`storage`, plus the realtime merge logic that keeps an
in-memory `collection` array in sync with Appwrite's websocket events.
Every concrete store is a thin [zustand](https://github.com/pmndrs/zustand)
wrapper that plugs its own document type and collection id into these helpers.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `Key` | `type Key = string` | An Appwrite collection/table id. |
| `Set<T, S>` | `type` | Generic, loosely-typed zustand setter shape, parameterized by the document type `T extends Models.Document` and the store shape `S extends RealtimeCollectionStore<T>` (defaults to `RealtimeCollectionStore<T>`). Matches zustand's `set(partial \| updater, ...args)` signature; used to type `fetchCollection`'s `set` parameter. |
| `RealtimeSetter` | `type RealtimeSetter = (partialState: any) => void` | Untyped/erased version of a zustand setter — what `RealtimeCollectionStore.realtimeSet` and `subscribeTier`'s `TierEntry.set` are typed as, since `subscribeTier` operates across stores with different concrete `T`. |
| `RealtimeEntity` | `type` | Minimal shape the realtime logic needs — see below. Satisfied by both `Models.Document` and `Models.File`. |
| `RealtimeCollectionStore<T>` | `interface` | The shape every concrete store must implement — see below. |
| `updateRealtimeCollection(key, collection, response, relationshipFields?)` | see below | Applies one realtime event to a collection array, returning the new array. |
| `addToCollection(key, data, options?)` | see below | Creates a row (optionally with a deterministic id). |
| `updateInCollection(key, data, silent?)` | see below | Updates a row. |
| `removeFromCollection(key, data)` | see below | Deletes a row. |
| `fetchCollection(key, set, queries?)` | see below | Loads the full collection once (initial fetch/refetch). |
| `subscribeTier(entries)` | see below | Opens one realtime subscription covering several stores at once. |

### `RealtimeEntity`

```ts
type RealtimeEntity = { $id: string; $updatedAt?: string; $createdAt?: string };
```

| Property | Type | Description |
|---|---|---|
| `$id` | `string` | Appwrite document/file id — the merge/dedup key throughout this file. |
| `$updatedAt` | `string?` | ISO timestamp of last update, used for stale-update and dedup checks. |
| `$createdAt` | `string?` | ISO timestamp of creation, used as the dedup timestamp fallback when `$updatedAt` is absent. |

### `RealtimeCollectionStore<T extends RealtimeEntity>`

| Property | Type | Description |
|---|---|---|
| `collection` | `T[]` | The in-memory array of documents/files this store holds; kept in sync with Appwrite by `updateRealtimeCollection`/`fetchCollection`. |
| `key` | `Key` | The Appwrite table/collection id this store reads and writes. |
| `realtimeSet` | `RealtimeSetter` | The setter realtime updates are relayed through — usually the store's raw zustand `set`, but may wrap it (e.g. to derive extra state alongside `collection`). |
| `channel` | `string?` | Overrides the default `databases.<DATABASE_ID>.collections.<key>.documents` realtime channel for non-document resources such as a storage bucket's file events. |
| `relationshipFields` | `readonly string[]?` | Names of relation attributes (to-one/to-many) that need the omitted-on-update workaround — see "The relationship-fields problem" below. |
| `init` | `() => void \| Promise<void>` | Store-specific bootstrap (typically an initial `fetchCollection` call); invoked once per store during app startup. |

### `updateRealtimeCollection<T extends Models.Document>(key: Key, collection: T[], response: RealtimeResponseEvent<T>, relationshipFields: readonly string[] = []): T[]`

| Parameter | Type | Description |
|---|---|---|
| `key` | `Key` | Collection id, used only as part of the dedup key passed to `isNewUpdate`. |
| `collection` | `T[]` | The current in-memory array to apply the event to. |
| `response` | `RealtimeResponseEvent<T>` | The raw Appwrite realtime message (`events: string[]`, `payload: T`, `channels: string[]`) as delivered by `client.subscribe`. |
| `relationshipFields` | `readonly string[]` | Forwarded to the update handler; defaults to `[]` (no relationship-field protection) when the store declares none. |

Derives the event type (`"create" \| "update" \| "delete" \| "unknown"`) by
matching `response.events` against Appwrite's `*.create`/`*.update`/`*.delete`
suffixes, drops the event entirely if `isNewUpdate` says it's a duplicate,
then dispatches to one of the internal (non-exported) handlers
`updateRealtimeCollectionCreate`, `updateRealtimeCollectionUpdate`, or
`updateRealtimeCollectionDelete` (an `"unknown"` event type is a no-op).
Returns the resulting array — callers (`subscribeTier`) are expected to
replace `collection` in state with the returned value.

### `addToCollection<T>(key: Key, data: Omit<T, keyof Models.Document>, options?: { rowId?: string; silentOnConflict?: boolean }): Promise<T | null>`

| Parameter | Type | Description |
|---|---|---|
| `key` | `Key` | Target table/collection id (Appwrite `tableId`). |
| `data` | `Omit<T, keyof Models.Document>` | The row's field values, excluding Appwrite's built-in document metadata (`$id`, `$createdAt`, etc). |
| `options.rowId` | `string?` | Explicit row id to create with; defaults to `ID.unique()` when omitted. Passing a deterministic id (e.g. `timerRowId(...)`) lets two clients racing to create "the first row for X" collide instead of duplicating — see "Deterministic ids" below. |
| `options.silentOnConflict` | `boolean?` | When `true` and creation fails with a 409/`document_already_exists`, fetches and returns the already-existing row instead of surfacing an error alert. |

Calls `tablesDB.createRow`. On success, returns the created row cast to `T`.
On a non-conflict error (or a conflict without `silentOnConflict`), shows an
`Alert` with the error message and returns `null`. On a conflict *with*
`silentOnConflict`, fetches the existing row via `tablesDB.getRow`; if that
fetch also fails, alerts and returns `null`.

### `updateInCollection<T>(key: Key, data: Partial<T & Models.Document> & { $id: string }, silent = false): Promise<boolean>`

| Parameter | Type | Description |
|---|---|---|
| `key` | `Key` | Target table/collection id. |
| `data` | `Partial<T & Models.Document> & { $id: string }` | Partial field updates; must include `$id` to identify the row. Any key starting with `$` (Appwrite metadata) or with an `undefined` value is stripped before sending. |
| `silent` | `boolean` | When `true`, suppresses the error `Alert` on failure (used by call sites that handle/report the error themselves). Defaults to `false`. |

Calls `tablesDB.updateRow` with the filtered field set. Returns `true` on
success, `false` on failure (after optionally alerting).

### `removeFromCollection<T>(key: Key, data: Partial<T & Models.Document> & { $id: string }): Promise<boolean>`

| Parameter | Type | Description |
|---|---|---|
| `key` | `Key` | Target table/collection id. |
| `data` | `Partial<T & Models.Document> & { $id: string }` | Must include `$id`; other fields are ignored. |

Calls `tablesDB.deleteRow`. Returns `true` on success; on failure, shows an
`Alert` with the error message and returns `false`.

### `fetchCollection<T extends Models.Document, S extends RealtimeCollectionStore<T> = RealtimeCollectionStore<T>>(key: Key, set: Set<T, S>, queries?: string[]): Promise<void>`

| Parameter | Type | Description |
|---|---|---|
| `key` | `Key` | Table/collection id to list rows from. |
| `set` | `Set<T, S>` | The store's zustand setter; called once with `{ collection: <rows> }` on success. |
| `queries` | `string[]?` | Additional Appwrite `Query` strings appended after `Query.limit(Number.MAX_SAFE_INTEGER)` (i.e. "fetch everything, plus these extra filters"). |

Calls `tablesDB.listRows` and, on success, replaces `collection` in the
store's state with the full result set. On failure, shows an `Alert` with
the error message and leaves state untouched. Used both for a store's
initial load and for manual refetches.

### `subscribeTier(entries: TierEntry[]): () => void`

| Parameter | Type | Description |
|---|---|---|
| `entries` | `TierEntry[]` | One entry per store to cover, each `{ key: Key; set: RealtimeSetter; channel?: string; relationshipFields?: readonly string[] }` (the internal, non-exported `TierEntry` type mirrors the relevant subset of `RealtimeCollectionStore`). |

Returns immediately with a no-op unsubscribe if `entries` is empty. Otherwise
computes each entry's realtime channel (`entry.channel` if set, else
`databases.<DATABASE_ID>.collections.<entry.key>.documents`), builds a
`channel → entry` map, and opens a single `client.subscribe(channels, cb)`
covering all of them at once. On each incoming message, finds the matching
entry by channel and calls its `set` with an updater that replaces
`collection` via `updateRealtimeCollection`, guarding the callback in
`try/catch` so one store's handler error doesn't break delivery to others.
Returns an unsubscribe function that tears down the underlying
`client.subscribe` call for the whole tier. See "`subscribeTier`" below for
why subscriptions are batched per-tier rather than per-store.

## How it works

### The relationship-fields problem

Appwrite's realtime payload for an `update` event can omit relationship
attributes specifically — a to-one relation comes back `null`, a to-many
one comes back `[]` — when that particular update didn't touch the
relation. `updateRealtimeCollectionUpdate` merges an incoming payload over
the existing local copy, and for every field named in
`relationshipFields` it re-applies this rule: if the existing value is
non-null/non-empty and the incoming value looks like "Appwrite omitted
this", the existing value is kept instead of being overwritten with
null/`[]`.

This is deliberately scoped to **only** the fields a store declares as
`relationshipFields` (e.g. `Timer`'s `playerPositions`, `Table`'s `players`/
`game`, `Player`'s `team`) — applying it to every field used to also catch
plain nullable attributes (e.g. `Timer.tableActiveResumedAt`,
`TimerSeat.roundLastPausedAt`): a legitimate write that clears one of
those back to `null` got silently reverted to its old non-null value by
this exact logic — a real, previously-shipped bug, not a hypothetical.
Stores with no relationship attributes simply omit the option (the
correct default).

### Deduping realtime events

`isNewUpdate` drops a realtime event if the exact same `(collection key,
document id, event type, $updatedAt)` combination was already processed
within the last 5 seconds — guards against Appwrite occasionally
delivering a genuine duplicate of the same event.

### Stale-update protection

`updateRealtimeCollectionUpdate` also ignores an incoming update whose
`$updatedAt` is older than or equal to what's already stored locally —
protects against an out-of-order delivery silently reverting a newer local
state to an older one.

### Deterministic ids (`addToCollection`'s `rowId`/`silentOnConflict`)

Several stores (timer, timer-seat, table-bell) pass a deterministic
`rowId` (built by a `*RowId` helper on the corresponding model, e.g.
[`timerRowId`](../models/timer.md)) instead of `ID.unique()`. Combined with
`silentOnConflict: true`, this means two devices racing to create "the
first document for X" collide at the database layer (a 409) instead of
each silently creating its own document — the conflict is caught and the
already-created row is fetched and returned instead of surfacing an error.

### `subscribeTier`

Opens **one** realtime subscription covering every store passed in,
relaying each incoming event to the matching store's `realtimeSet`.
Appwrite's SDK multiplexes all subscriptions onto one shared WebSocket
regardless, but every independent `client.subscribe()` call forces that
socket to be torn down and recreated (its URL is derived from *all*
currently-subscribed channels). Subscribing once per "tier" of stores
(rather than once per store) keeps that churn to one reconnect per tier
transition instead of one per collection — see
[`RealTimeStoreProvider`](../bootstrap/RealTimeStoreProvider.md) for how
tiers are assembled.

## Used by

Every store in [`lib/stores/appwrite/`](appwrite/README.md), plus
[`RealTimeStoreProvider`](../bootstrap/RealTimeStoreProvider.md) and
[`FeatureFlags.tsx`](../components/admin/FeatureFlags.md) directly (for
`updateInCollection`/`removeFromCollection`).
