# `lib/hooks/useRequireAuth.ts`

[← lib/hooks](README.md)

## Purpose

Guards a screen behind authentication — redirects to the login screen if
there's no authenticated user once the auth state has finished loading.

## Exports

### `useRequireAuth(): AuthContextType`

Takes no parameters. Calls `useAuth()` and returns its value unchanged
(`{ user, loading, login, loginWithPin, logout, isAdmin, isPinVerified }` —
see [`lib/auth.tsx`](../auth.md)), but layers a side effect on top: a
`useEffect` that watches `[auth.user, auth.loading]` and calls
`router.replace("/(pages)/login")` once loading has finished (`loading ===
false`) and there's still no `user`. Screens that call this hook get
redirected to the login screen automatically as soon as it's clear the
visitor isn't authenticated, without having to check `auth.loading` /
`auth.user` themselves. While `auth.loading` is still `true` the effect is a
no-op, so an unauthenticated visitor isn't bounced to `/login` mid-load.

## Used by

- [`app/(pages)/(user)/game.tsx`](../../app/(pages)/(user)/game.md), [`lottery.tsx`](../../app/(pages)/(user)/lottery.md), [`participants.tsx`](../../app/(pages)/(user)/participants.md), [`results.tsx`](../../app/(pages)/(user)/results.md), [`rules.tsx`](../../app/(pages)/(user)/rules.md), [`schedule.tsx`](../../app/(pages)/(user)/schedule.md), [`signature.tsx`](../../app/(pages)/(user)/signature.md), [`timer.tsx`](../../app/(pages)/(user)/timer.md)
