# `lib/notifications/useLotteryNotifications.ts`

[← lib/notifications](README.md)

## Purpose

Notifies non-admin users when a new lottery photo is uploaded, for any game.

## Exports

### `useLotteryNotifications(isAdmin: boolean)`

No return value — a side-effect-only hook, mounted once near the app root
(see [`RealTimeStoreProvider`](../bootstrap/RealTimeStoreProvider.md)).

## How it works

Does nothing for admins (`isAdmin === true`) — only non-admin devices should
be pinged about new lottery photos.

- On mount, records the current time (`mountedAtRef`) and requests
  notification permission once (`permissionsRequestedRef`).
- Watches [`useLotteryStore`](../stores/appwrite/lottery-store.md)'s
  collection. Any photo whose `$createdAt` is after the mount time AND
  hasn't already triggered a notification (`notifiedIdsRef`) gets one. The
  dedup set is needed because the underlying collection can be re-set
  multiple times for the same upload (the realtime `create` event, plus an
  explicit post-upload refresh that closes an app-backgrounding race) —
  without it, one upload could fire more than one notification.
- The game name shown in the notification is resolved by parsing the game
  id out of the photo's filename ([`parseLotteryFileName`](../utils/lottery.md))
  and looking it up in [`useScheduleStore`](../stores/appwrite/schedule-store.md).
  Falls back to a generic message if no matching schedule entry is found.
- Actually firing the notification goes through
  [`triggerLocalNotification`](localNotify.md).

## Used by

- [`lib/bootstrap/RealTimeStoreProvider.tsx`](../bootstrap/RealTimeStoreProvider.md)
