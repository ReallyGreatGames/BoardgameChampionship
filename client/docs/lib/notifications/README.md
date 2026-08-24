# `lib/notifications`

[← lib](../README.md)

Local (device-only) notifications — not push notifications. Every hook here
watches an Appwrite realtime collection and fires a local notification for
newly-created rows it hasn't notified about yet.

## Files

| File | Purpose |
|---|---|
| [localNotify.md](localNotify.md) | Low-level cross-platform notification/haptic/sound primitives |
| [useTableBellNotifications.md](useTableBellNotifications.md) | Notifies admins about new table bells |

The hook is mounted from [`RealTimeStoreProvider`](../bootstrap/RealTimeStoreProvider.md). Lottery
photos and options-lottery pulls intentionally have no notification — that was removed.
