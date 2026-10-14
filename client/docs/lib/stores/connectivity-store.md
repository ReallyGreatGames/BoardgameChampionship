# `lib/stores/connectivity-store.ts`

[← lib/stores](README.md)

## Purpose

Tiny zustand store holding two pieces of app-wide connection/UI state that
several otherwise-unrelated modules need to agree on: the current network
status, and whether a timer screen is currently active. It is not backed by
any Appwrite collection — it mirrors a device fact (NetInfo) rather than
server data, so it lives alongside the collection stores instead of under
[`appwrite/`](appwrite/README.md).

## Exports

### `useConnectivityStore` (zustand hook)

| State/Method | Type | Purpose |
|---|---|---|
| `isOnline` | `boolean \| null` | Tri-state network status: `true` connected and internet-reachable, `false` offline, `null` before NetInfo's first event has been received. `null` is deliberately distinct from `false` so "unknown yet" callers don't treat startup as offline. |
| `timerActive` | `boolean` | Whether an interactive timer screen (the signed-in [timer](../../app/(pages)/(user)/timer.md) or the offline timer) is currently mounted. Defaults to `false`. |
| `setOnline(online: boolean): void` | — | Records the latest connectivity result. Called by `lib/bootstrap/ConnectivityProvider.tsx` from its NetInfo listener. |
| `setTimerActive(active: boolean): void` | — | Marks a timer screen active on focus and inactive on blur. Called by both timer screens' `useFocusEffect` cleanup. |

## How it works

The store has no logic of its own — it is a shared mutable value holder.
`isOnline` is written from exactly one place (`lib/bootstrap/ConnectivityProvider.tsx`,
which subscribes to `@react-native-community/netinfo`) and read from many:
the realtime engine and the offline write queue (`lib/cache/write-queue.ts`)
both short-circuit all network work while it is `false`,
[`auth`](../auth.md) skips its "tournament ended → log out" redirect while
offline, [`RealTimeStoreProvider`](../bootstrap/RealTimeStoreProvider.md)
uses an offline → online transition to flush the outbox and reconnect tiers,
and `lib/components/shell/ConnectivityPill.tsx` renders the status banner.
`timerActive` is toggled by the timer screens purely so that banner can
suppress itself while a timer is open. On
[`game`](../../app/(pages)/(user)/game.md) the `isOnline` flag additionally
decides whether the "timer" action tile may be force-enabled offline.

## Used by

- `lib/bootstrap/ConnectivityProvider.tsx` — writes `isOnline`
- [`lib/bootstrap/RealTimeStoreProvider.tsx`](../bootstrap/RealTimeStoreProvider.md) — flushes the outbox + reconnects tiers on offline → online
- [`lib/stores/real-time-store.ts`](real-time-store.md) — `isOffline()` gate around every CRUD call
- `lib/cache/write-queue.ts` — skips a flush while not confirmed online
- [`lib/auth.tsx`](../auth.md) — skips the tournament-inactive logout while offline
- `lib/components/shell/ConnectivityPill.tsx` — status banner
- [`app/(pages)/(user)/timer.tsx`](../../app/(pages)/(user)/timer.md) and `app/(pages)/offline-timer.tsx` — `setTimerActive`
- [`app/(pages)/(user)/game.tsx`](../../app/(pages)/(user)/game.md) — `isOnline` force-enables the timer tile offline

## Related

- `lib/cache/write-queue.ts` — the offline write outbox this flag gates
- [`lib/stores/real-time-store.md`](real-time-store.md) — the CRUD engine that reads it
