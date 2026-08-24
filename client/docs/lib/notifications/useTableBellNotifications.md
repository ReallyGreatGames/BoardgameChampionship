# `lib/notifications/useTableBellNotifications.ts`

[← lib/notifications](README.md)

## Purpose

Notifies admins when a new (unacknowledged) table bell is created.

## Exports

### `useTableBellNotifications(isAdmin: boolean): void`

| Parameter | Type | Description |
|---|---|---|
| `isAdmin` | `boolean` | Whether the current user is an admin/staff member; gates the entire hook (see below). |

No return value — a side-effect-only hook, mounted once near the app root
(see [`RealTimeStoreProvider`](../bootstrap/RealTimeStoreProvider.md)). It
subscribes to `useTableBellStore((s) => s.collection)` (the live array of
table-bell documents) and keeps three refs across renders:

- `mountedAtRef` — `Date.now()` timestamp captured the first time the hook
  runs with `isAdmin === true`; defines the cutoff for "new" bells.
- `permissionsRequestedRef` — guards `requestNotificationPermissions()` so
  it's only called once per mount, not on every collection update.
- `notifiedIdsRef` — a `Set<string>` of `$id`s already notified about, so
  the same bell never fires two notifications.

Two effects run: one (keyed on `isAdmin`) sets `mountedAtRef` and requests
permissions; the other (keyed on `[collection, isAdmin, t]`) filters
`collection` down to bells created after the mount cutoff, still
unacknowledged, and not yet in `notifiedIdsRef`, then calls
`triggerLocalNotification(title, body)` (from
[`localNotify.ts`](localNotify.md)) for each, marking it notified first to
avoid re-entrant duplicates.

## How it works

Only runs **for** admins (`isAdmin === true`), since bells are a
staff-facing concern.

- On mount, records the mount time and requests notification permission once.
- Watches [`useTableBellStore`](../stores/appwrite/table-bell-store.md)'s
  collection. A bell notifies if it was created after mount, is still
  unacknowledged (`!bell.acknowledgeTime`), and hasn't already been
  notified about (`notifiedIdsRef`) — the dedup guards against the
  collection being re-set multiple times for the same bell (realtime event
  plus any reconnect-triggered refetch).
- The notification body includes the table number, and the bell's `reason`
  if one is set.

## Used by

- [`lib/bootstrap/RealTimeStoreProvider.tsx`](../bootstrap/RealTimeStoreProvider.md)
