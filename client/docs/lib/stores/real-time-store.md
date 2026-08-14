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
| `RealtimeCollectionStore<T>` | interface | The shape every concrete store must implement — see below |
| `RealtimeEntity` | Type | Minimal shape the realtime logic needs (`$id`, `$updatedAt?`, `$createdAt?`) — satisfied by both `Models.Document` and `Models.File` |
| `RealtimeSetter` | Type | Loosely-typed zustand `set` function |
| `Key` | Type | `string` — an Appwrite collection id |
| `updateRealtimeCollection(key, collection, response, relationshipFields?)` | see below | Applies one realtime event to a collection array |
| `addToCollection(key, data, options?)` | `<T>(...) => Promise<T \| null>` | Creates a row (optionally with a deterministic id, see below) |
| `updateInCollection(key, data, silent?)` | `<T>(...) => Promise<boolean>` | Updates a row |
| `removeFromCollection(key, data)` | `<T>(...) => Promise<boolean>` | Deletes a row |
| `fetchCollection(key, set, queries?)` | `<T, S>(...) => Promise<void>` | Loads the full collection once (initial fetch/refetch) |
| `subscribeTier(entries)` | `(TierEntry[]) => () => void` | Opens one realtime subscription covering several stores at once |

### `RealtimeCollectionStore<T>`

Every concrete store's state must include: `collection: T[]`, `key: Key`,
`realtimeSet` (the setter realtime updates are relayed through — usually
the store's raw zustand `set`, but may wrap it, e.g. to derive extra
state), optionally `channel` (overrides the default
`databases.*.collections.*.documents` channel for non-document resources
such as a storage bucket's file events), optionally `relationshipFields`
(see below), and `init()`.

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
