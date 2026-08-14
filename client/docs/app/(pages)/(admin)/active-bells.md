# `app/(pages)/(admin)/active-bells.tsx`

[← app](../../README.md)

## Route

`/active-bells` — admin only.

## Purpose

Full-screen list of every table's [`TableBell`](../../../lib/models/table-bell.md),
sorted unacknowledged-first (then by how long they've been ringing),
with dismiss/acknowledge actions.

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

## Related

- [`lib/hooks/useTableBellActions.ts`](../../../lib/hooks/useTableBellActions.md)
- [`lib/stores/appwrite/table-bell-store.ts`](../../../lib/stores/appwrite/table-bell-store.md)
