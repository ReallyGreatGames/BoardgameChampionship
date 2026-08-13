# `lib/components/admin/TournamentSettings.tsx`

[← lib/components/admin](README.md)

## Purpose

Editor for [`Tournament`](../../models/tournament.md) rows (active flag,
PIN, type) — lists the 25 most recent rows, each independently editable/saveable.

## Exports

| Export | Purpose |
|---|---|
| `TournamentSettings` (component) | The tab itself |

(`TournamentCard`, the per-row editor, is a local, unexported helper.)

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
