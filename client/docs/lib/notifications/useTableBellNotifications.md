# `lib/notifications/useTableBellNotifications.ts`

[← lib/notifications](README.md)

## Purpose

Notifies admins when a new (unacknowledged) table bell is created.

## Exports

### `useTableBellNotifications(isAdmin: boolean)`

No return value — a side-effect-only hook, mounted once near the app root
(see [`RealTimeStoreProvider`](../bootstrap/RealTimeStoreProvider.md)).

## How it works

Mirrors [`useLotteryNotifications`](useLotteryNotifications.md)'s structure,
but inverted — only runs **for** admins (`isAdmin === true`), since bells
are a staff-facing concern.

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
