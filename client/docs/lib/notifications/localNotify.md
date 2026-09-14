# `lib/notifications/localNotify.ts`

[← lib/notifications](README.md)

## Purpose

Cross-platform primitives for triggering a local notification with sound/haptics.

## Exports

### `requestNotificationPermissions(): Promise<void>`

No parameters. On web, only calls `Notification.requestPermission()` when the
browser's `Notification` API exists and permission is still in the `"default"`
(unasked) state — it never re-prompts if the user already granted or denied.
On native, delegates to `Notifications.requestPermissionsAsync()` from
`expo-notifications`, which shows the OS permission dialog if needed — a
no-op in Expo Go on Android, where the module isn't loaded (see "Expo Go on
Android").
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

### Expo Go on Android

Since SDK 53, Expo Go on Android rejects `expo-notifications` as soon as the
module is evaluated ("Android push notifications functionality … was
removed from Expo Go"), which kept the whole app from opening there — even
though this file only uses *local* notifications, never push.

The module is therefore imported only as a type (`import type`, erased at
build time) and loaded with a conditional `require` into the internal
`Notifications: typeof NotificationsModule | null`:

| Environment | `Notifications` |
|---|---|
| web | `null` — the web branches use browser APIs instead |
| Expo Go on Android (`isExpoGoAndroid`: `Platform.OS === "android"` and `Constants.executionEnvironment === ExecutionEnvironment.StoreClient`) | `null` — never evaluated, so the Expo Go error can't fire |
| development/production builds, Expo Go on iOS | the real module |

Every use goes through `Notifications?.…`, so in Expo Go on Android the
table bell still fires its haptic but shows no system notification. Real
builds are unaffected. The `require` carries an
`@typescript-eslint/no-require-imports` disable: a static `import` is
exactly what would evaluate the module eagerly.

### Foreground display

At module load (when `Notifications` is loaded), `setNotificationHandler`
is configured so notifications still show while the app is foregrounded
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
  `sound: true` via `Notifications.scheduleNotificationAsync` — the latter
  skipped in Expo Go on Android.

## Used by

- [`lib/notifications/useTableBellNotifications.ts`](useTableBellNotifications.md)
