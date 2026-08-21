# `lib/notifications/localNotify.ts`

[← lib/notifications](README.md)

## Purpose

Cross-platform primitives for triggering a local notification with sound/haptics.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `requestNotificationPermissions()` | `() => Promise<void>` | Requests notification permission (browser `Notification` API on web, `expo-notifications` on native) |
| `triggerLocalNotification(title, body)` | `(string, string) => Promise<void>` | Fires a local notification with sound/vibration |

## How it works

At module load (native only), `Notifications.setNotificationHandler` is
configured so notifications still show while the app is foregrounded
(Expo's default is to suppress them in that case).

`triggerLocalNotification` branches by platform:
- **Web**: plays a synthesized two-tone chime via the Web Audio API
  (`playWebNotificationSound`, silently no-ops if `AudioContext` is
  unavailable), vibrates the device if supported, and shows a browser
  `Notification` if permission was already granted.
- **Native**: fires a warning-level haptic (`expo-haptics`) and schedules an
  immediate local OS notification with sound via `expo-notifications`.

## Used by

- [`lib/notifications/useTableBellNotifications.ts`](useTableBellNotifications.md)
