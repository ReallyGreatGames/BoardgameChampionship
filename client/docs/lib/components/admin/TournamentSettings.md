# `lib/components/admin/TournamentSettings.tsx`

[← lib/components/admin](README.md)

## Purpose

Editor for [`Tournament`](../../models/tournament.md) rows (active flag,
PIN, type) — lists the 25 most recent rows, each independently editable/saveable.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `TournamentSettings` | `(): JSX.Element` | No props. Fetches the 25 most-recent [`Tournament`](../../models/tournament.md) rows and renders one `TournamentCard` per row (loading/error/empty states handled inline). |

### Internal helper (not exported)

| Function | Signature | Behavior |
|---|---|---|
| `TournamentCard` | `({ row: Tournament; onSaved: () => void }): JSX.Element` | Per-row editor. Holds local `active`/`pin`/`tournamentType` state seeded from `row`, computes `dirty` by comparing that state to `row`'s last-known values, and saves via a `useMutation` that calls `tablesDB.updateRow` with the edited fields and calls `onSaved()` on success. |
| `handleSaved` | `(): void` | Passed to every `TournamentCard` as `onSaved`; calls `queryClient.invalidateQueries({ queryKey: ["tournament"] })` after a successful row save. |

### `TournamentCardProps`

| Property | Type | Meaning |
|---|---|---|
| `row` | `Tournament` | The tournament row this card edits; its `active`, `pin`, and `type` fields seed the card's local editable state. |
| `onSaved` | `() => void` | Called after a successful save, so the parent can invalidate other queries that depend on tournament data. |

## How it works

Uses `@tanstack/react-query` directly (`useQuery`/`useMutation`) rather
than the app's usual zustand + realtime store pattern — this is a rarely-used
admin editing surface, not something that needs to stay live via realtime
subscriptions. `dirty` (per card) compares local field state against the
row's last-known values; the save button is disabled unless something
actually changed. On successful save, `queryClient.invalidateQueries({
queryKey: ["tournament"] })` is called — note this key doesn't match this
component's own query key (`"admin-tournaments"`); it exists to invalidate
some other query elsewhere keyed `"tournament"` (if any is registered) so
this edit is picked up outside this component's own tree. The main app's
own tournament state, however, comes from
[`useTournamentStore`](../../stores/appwrite/tournament-store.md)'s
realtime subscription, not from react-query at all, so it picks up the
change independently via Appwrite's realtime event.

## Used by

- [`app/(pages)/(admin)/admin/index.tsx`](../../../app/(pages)/(admin)/admin/index.md)
