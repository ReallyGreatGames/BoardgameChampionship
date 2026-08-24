# `app/(pages)/(admin)/active-bells.tsx`

[← app](../../README.md)

## Route

`/active-bells` — admin only.

## Purpose

Full-screen list of every table's [`TableBell`](../../../lib/models/table-bell.md),
sorted unacknowledged-first (then by how long they've been ringing),
with dismiss/acknowledge actions.

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `ActiveBellsPage` (default) | `(): JSX.Element \| null` | Screen component for `/active-bells`. Lists every `TableBell`, sorted unacknowledged-first then by ring duration, each with a live elapsed-time label and a press action to acknowledge/dismiss. Returns `null` while auth is loading, unauthenticated, or not an admin. |

### `handleBellPress(bell: TableBell): Promise<void>`

If `bell.acknowledgeTime` is already set, calls `bellActions.dismiss(bell, ...)` with a translated confirm dialog (destructive styling) to remove the bell; otherwise calls `bellActions.acknowledge(bell, ...)` with a translated confirm dialog to mark it acknowledged (stops it ringing, moves it to the acknowledged group).

### `makeStyles(colors: ReturnType<typeof useTheme>["colors"]): StyleSheet`

Builds the list/card/bell-button styles (including active vs. success color variants) from theme colors; memoized via `useMemo` on `colors`.

## How it works

Route-guards itself with its own effect (redirects to `/login` if not an
admin) rather than [`useRequireAuth`](../../../lib/hooks/useRequireAuth.md) —
that hook only checks for *any* authenticated user, not specifically an admin.

A bell is `isLocked` (dismiss disabled) if `bell.locked` is true and the
current user isn't an admin — since this screen is admin-only anyway,
`isLocked` is always `false` here in practice; the check is inherited from
[`useTableBellActions`](../../../lib/hooks/useTableBellActions.md)'s shared
`canDelete` logic, which is also used on the non-admin-only
[`game.tsx`](../(user)/game.md) screen.

A second effect ticks a local `now: number` state every second (`setInterval(() => setNow(Date.now()), 1000)`) purely to force re-render of the elapsed-time labels (`formatElapsed(bell.startTime, now)`) — the underlying bell data doesn't change every second, only the derived display text does.

`sorted` (`useMemo`, deps `[tableBellStore.collection]`) sorts a copy of the bell collection: unacknowledged bells (`!bell.acknowledgeTime`) always sort before acknowledged ones, and within each group, older `startTime` sorts first — so the longest-ringing, still-unacknowledged bell always appears at the top.

## Related

- [`lib/hooks/useTableBellActions.ts`](../../../lib/hooks/useTableBellActions.md)
- [`lib/stores/appwrite/table-bell-store.ts`](../../../lib/stores/appwrite/table-bell-store.md)
