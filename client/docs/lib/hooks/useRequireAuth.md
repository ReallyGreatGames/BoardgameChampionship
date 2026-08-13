# `lib/hooks/useRequireAuth.ts`

[← lib/hooks](README.md)

## Purpose

Guards a screen behind authentication — redirects to the login screen if
there's no authenticated user once the auth state has finished loading.

## Exports

### `useRequireAuth()`

Returns the same value as [`useAuth()`](../auth.md) (passthrough), but adds
an effect that calls `router.replace("/(pages)/login")` once `auth.loading`
is `false` and `auth.user` is falsy.

## Used by

- [`app/(pages)/(user)/game.tsx`](../../app/(pages)/(user)/game.md), [`lottery.tsx`](../../app/(pages)/(user)/lottery.md), [`results.tsx`](../../app/(pages)/(user)/results.md), [`rules.tsx`](../../app/(pages)/(user)/rules.md), [`schedule.tsx`](../../app/(pages)/(user)/schedule.md), [`signature.tsx`](../../app/(pages)/(user)/signature.md), [`timer.tsx`](../../app/(pages)/(user)/timer.md)
