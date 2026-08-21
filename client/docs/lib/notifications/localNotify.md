# `lib/notifications/localNotify.ts`

[← lib/notifications](README.md)

## Purpose

Cross-platform primitives for triggering a local notification with sound/haptics.

## Exports

### `requestNotificationPermissions(): Promise<void>`

No parameters. On web, only calls `Notification.requestPermission()` when the
browser's `Notification` API exists and permission is still in the `"default"`
(unasked) state — it never re-prompts if the user already granted or denied.
On native, delegates unconditionally to `Notifications.requestPermissionsAsync()`
from `expo-notifications`, which shows the OS permission dialog if needed.
Resolves once the permission decision (or no-op) completes; does not return
the resulting permission status.

### `triggerLocalNotification(title: string, body: string): Promise<void>`

| Parameter | Type | Description |
|---|---|---|
| `title` | `string` | Notification title text. |
| `body` | `string` | Notification body/message text. |

Fires a single local notification with sound and haptic/vibration feedback,
branching by `Platform.OS`. Returns a promise that resolves once the
platform-specific notification call has been issued (native) or synchronously
kicked off (web). See "How it works" for the platform-specific behavior.

## How it works

At module load (native only), `Notifications.setNotificationHandler` is
configured so notifications still show while the app is foregrounded
(Expo's default is to suppress them in that case).

`triggerLocalNotification` branches by platform:
- **Web**: plays a synthesized two-tone chime via the Web Audio API
  (internal, non-exported helper `playWebNotificationSound()` — two sine
  oscillators at 880Hz/1108Hz with an exponential pitch/gain decay over
  ~1.4s; silently no-ops if `AudioContext`/`webkitAudioContext` is
  unavailable or throws), vibrates the device with the pattern
  `[300, 100, 300, 100, 300]` ms if `navigator.vibrate` is supported, and
  shows a browser `Notification(title, { body, icon })` only if permission
  is already `"granted"` (it never prompts here — prompting is
  `requestNotificationPermissions`'s job).
- **Native**: fires a `Warning`-level haptic (`Haptics.notificationAsync`)
  and schedules an immediate local OS notification (`trigger: null`) with
  `sound: true` via `Notifications.scheduleNotificationAsync`.

## Used by

- [`lib/notifications/useTableBellNotifications.ts`](useTableBellNotifications.md)
