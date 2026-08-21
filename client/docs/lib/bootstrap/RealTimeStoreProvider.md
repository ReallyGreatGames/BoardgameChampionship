# `lib/bootstrap/RealTimeStoreProvider.tsx`

[← lib/bootstrap](README.md)

## Purpose

Initializes every [`lib/stores/appwrite/*`](../stores/appwrite/README.md)
store and its realtime subscription, tiered by how much auth is required,
and re-establishes everything on reconnect. Renders nothing (`return
null`) — it exists purely for its side effects.

## Exports

### `RealTimeStoreProvider` (component)

No props.

## How it works

### Tiers

Stores are grouped into three tiers based on what they require:

- **`globalInits`** — [`useFeatureFlagStore`](../stores/appwrite/feature-flag-store.md),
  [`useTournamentStore`](../stores/appwrite/tournament-store.md). Opens
  immediately, no auth required (needed even on the pre-login screen).
- **`userInits`** — every other store (schedule, table-bell, rule, timer,
  timer-seat, timer-settings, result, table, team, player, lottery,
  options-lottery). Opens once any authenticated user (PIN-verified or
  admin) is ready.
- **`adminInits`** — currently empty; reserved for admin-only stores.

Each tier's stores fetch their own initial data independently (each store's
own `init()`), but share a **single** realtime subscription per tier via
[`subscribeTier`](../stores/real-time-store.md) — Appwrite multiplexes
every subscription onto one shared WebSocket regardless, and subscribing
once per tier (instead of once per store) avoids the socket being torn
down and rebuilt once per collection on every reconnect.

`openTier(tier, stores)` tears down that tier's existing subscription (if
any), awaits every store's `init()` in parallel, then opens a fresh
subscription. Three effects call this once each — for `global`
immediately, for `user` once `isAuthenticated` (`isAdmin || isPinVerified`),
for `admin` once `isAdmin` — each gated on `loading` from
[`useAuth`](../auth.md) so they don't fire on a still-resolving auth state.

### Reconnection

`reconnectAll(reason)` tears down and reopens all three tiers at once.
Triggered by two listeners:

- `NetInfo.addEventListener` — reconnects when the device's network
  transitions from disconnected to connected.
- `AppState.addEventListener("change", ...)` — reconnects whenever the app
  is foregrounded (`nextState === "active"`), since a backgrounded app's
  realtime socket may have gone stale or been suspended by the OS.

### Notifications

Also mounts [`useTableBellNotifications(isAdmin)`](../notifications/useTableBellNotifications.md) —
a side-effect-only hook that needs the same stores this provider already
initializes, so it's mounted here rather than duplicated per screen. Lottery
photos and options-lottery pulls have no notification hook (removed by
request).

## Used by

- [`lib/bootstrap/BootstrapProvider.tsx`](BootstrapProvider.md)
