# `lib/notifications`

[← lib](../README.md)

Local (device-only) notifications — not push notifications. Every hook here
watches an Appwrite realtime collection and fires a local notification for
newly-created rows it hasn't notified about yet.

## Files

| File | Purpose |
|---|---|
| [localNotify.md](localNotify.md) | Low-level cross-platform notification/haptic/sound primitives |
| [useLotteryNotifications.md](useLotteryNotifications.md) | Notifies non-admins about new lottery photos |
| [useTableBellNotifications.md](useTableBellNotifications.md) | Notifies admins about new table bells |

Both hooks are mounted from [`RealTimeStoreProvider`](../bootstrap/RealTimeStoreProvider.md).
