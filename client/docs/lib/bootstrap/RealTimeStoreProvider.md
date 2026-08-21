# `lib/bootstrap/RealTimeStoreProvider.tsx`

[← lib/bootstrap](README.md)

## Purpose

Initializes every [`lib/stores/appwrite/*`](../stores/appwrite/README.md)
store and its realtime subscription, tiered by how much auth is required,
and re-establishes everything on reconnect. Renders nothing (`return
null`) — it exists purely for its side effects.

## Exports

### `RealTimeStoreProvider(): JSX.Element | null`

No props, no parameters. Always returns `null` — every effect of mounting
it is a side effect (store initialization, realtime subscriptions, event
listeners); there is nothing for it to render.

### `Tier` (internal type)

`"global" | "user" | "admin"` — the three subscription tiers described
below. Used as the key into the `tierUnsubscribes` ref and as the
parameter to `openTier`.

### Internal helpers

These aren't exported, but they're the mechanism the whole file is built
on, so they're documented here.

#### `tierEntries(stores: any[]): TierEntry[]`

`stores` — the array of Zustand store hooks for one tier (e.g.
`globalInits`). For each store, reads its current state via
`store.getState()` and projects out just the fields
[`subscribeTier`](../stores/real-time-store.md) needs: `key`
(collection/table id), `set` (the store's `realtimeSet` setter),
`channel` (optional override channel string) and `relationshipFields`
(optional array of relation field names used to merge realtime updates).
Returns one `{ key, set, channel, relationshipFields }` descriptor per
store — this is the payload handed to `subscribeTier`.

#### `loadTier(stores: any[]): Promise<void>`

`stores` — same shape as above. Calls `store.getState().init()` for every
store in the tier and awaits all of them with `Promise.all`, so a tier's
stores fetch their initial collections in parallel rather than one after
another. Resolves once every store in the tier has finished its own
`init()`.

#### `openTier(tier: Tier, stores: any[]): Promise<void>` — `useCallback`, deps `[]`

`tier` — which of `"global" | "user" | "admin"` is being (re)opened.
`stores` — that tier's store list. First calls whatever unsubscribe
function is currently stored for `tier` (if any) and clears the ref slot,
so a re-open never leaves a stale subscription running alongside the new
one. Then awaits `loadTier(stores)` so each store has fresh data before
subscribing, and finally opens one shared subscription via
`subscribeTier(tierEntries(stores))`, storing the returned unsubscribe
function back into `tierUnsubscribes.current[tier]`. Has no dependencies
because it only touches the ref (stable identity) and its own arguments —
this lets it be called safely from effects and from `reconnectAll` without
those needing `openTier` as a re-triggering dependency.

#### `reconnectAll(reason: string): void` — `useCallback`, deps `[isAuthenticated, isAdmin, openTier]`

`reason` — a short human-readable string logged via `console.debug` for
diagnosing why a reconnect happened (e.g. `"network restored"`,
`"app foregrounded"`). Tears down all three tiers' subscriptions
unconditionally, resets `tierUnsubscribes.current` to
`{ global: null, user: null, admin: null }`, then re-opens `"global"`
unconditionally, `"user"` if `isAuthenticated`, and `"admin"` if `isAdmin`.
The re-opens are fire-and-forget (`openTier`'s returned promise isn't
awaited) since there's no caller waiting on reconnect completion.

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

### Why a ref instead of state for the unsubscribe functions

`tierUnsubscribes` is a `useRef<Record<Tier, (() => void) | null>>`, not
`useState`. Storing the three tiers' unsubscribe closures in a ref lets
`openTier` and `reconnectAll` read and mutate "what's currently
subscribed" synchronously, without a re-render (there's nothing to
re-render — the component returns `null`) and without needing the current
subscriptions as a dependency of any `useCallback`/`useEffect`, which
would otherwise force those to be redefined (and effects to re-fire) every
time a tier opens or closes. It's the classic "mutable box that needs to
survive renders but never needs to trigger one" case.

Three separate effects (one per tier) rather than a single combined effect
exist because each tier has a different readiness condition (`global`:
none; `user`: `isAuthenticated`; `admin`: `isAdmin`) and the three become
ready at different, independent points in the auth lifecycle — collapsing
them into one effect would mean re-deriving all three tiers' open/closed
state from scratch on every dependency change instead of only the tier
that actually became ready.

### Reconnection

`reconnectAll(reason)` tears down and reopens all three tiers at once.
Triggered by two listeners:

- `NetInfo.addEventListener` — reconnects when the device's network
  transitions from disconnected to connected.
- `AppState.addEventListener("change", ...)` — reconnects whenever the app
  is foregrounded (`nextState === "active"`), since a backgrounded app's
  realtime socket may have gone stale or been suspended by the OS.

Both listener effects depend on `reconnectAll`, which itself changes
identity whenever `isAuthenticated` or `isAdmin` changes (its
`useCallback` deps). That means logging in/out unmounts and remounts both
listeners: the `NetInfo` listener's `wasConnected` local resets to `true`
on that remount, and `AppState`'s listener is simply re-registered — so a
connectivity transition that happens in the same tick as an auth change
could in principle be missed by the old listener and not yet observed by
the new one. In practice this is an acceptable trade-off since `openTier`
already runs once per tier whenever its own readiness condition changes,
which covers the common case (auth changing implies the relevant tier is
about to open anyway).

### Notifications

Also mounts
[`useTableBellNotifications(isAdmin: boolean): void`](../notifications/useTableBellNotifications.md) —
a side-effect-only hook that needs the same stores this provider already
initializes, so it's mounted here rather than duplicated per screen.
`isAdmin` tells it whether to raise admin-facing table-bell notifications.
Lottery photos and options-lottery pulls have no notification hook
(removed by request).

## Used by

- [`lib/bootstrap/BootstrapProvider.tsx`](BootstrapProvider.md)
