# `app/(pages)/(admin)/admin/_layout.tsx`

[← app](../../../README.md)

## Purpose

Route guard for everything under `/admin`: redirects to `/login` unless
the current user is both authenticated and an admin. Shows a plain
full-screen spinner while auth is still resolving, and renders nothing
while redirecting.

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `AdminLayout` (default) | `(): JSX.Element \| null` | Layout for the `/admin` segment. Destructures `user`, `loading`, `isAdmin` from `useAuth()`; while `loading` shows a full-screen `ActivityIndicator`; once resolved, redirects to `/login` if the user is missing or not an admin (returning `null` during the redirect), otherwise renders `<Stack screenOptions={{ headerShown: false }} />` to host the child routes. |

## How it works

Uses a plain `<Stack screenOptions={{ headerShown: false }} />` as the
actual layout — the admin dashboard
([`admin/index.tsx`](index.md)) provides its own header/tab bar, so
this layer only needs to gate access, not render chrome.

The `useEffect` (deps: `[user, loading, isAdmin]`) is the actual guard: it bails out early while `loading` is true so it never redirects based on a stale/unresolved auth state, and only calls `router.replace("/login")` once loading has settled and the resolved user fails the `user && isAdmin` check. The render logic mirrors this same condition (loading → spinner, unauthorized → `null`, otherwise → `Stack`) so the UI never flashes protected content before the redirect effect fires.

## Registers

- [`app/(pages)/(admin)/admin/index.tsx`](index.md)

## Related

- [`lib/auth.tsx`](../../../../lib/auth.md)
