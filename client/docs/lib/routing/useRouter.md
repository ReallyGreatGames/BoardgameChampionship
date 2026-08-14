# `lib/routing/useRouter.ts`

[← lib/routing](README.md)

## Purpose

Small wrapper around `expo-router` that provides a single central rule for
where a user should be routed based on auth/player state.

## Exports

### `useRouter()`

Reads `user`, `isAdmin`, `isPinVerified` from [`useAuth`](../auth.md) and
`player`, `playerLoading` from [`usePlayer`](../bootstrap/PlayerProvider.md).
Returns:

| Function | Purpose |
|---|---|
| `navigate(path, options?)` | Thin wrapper around `expo-router`'s `router.navigate` |
| `routeDeterministic()` | See below |

## How it works

`routeDeterministic` encapsulates the order in which a user's destination
is determined:

1. No `user`, not admin, no verified PIN → back to the home screen (`/`)
2. Admin → `/admin`
3. While the player is still loading (`playerLoading`) → do nothing (wait)
4. No `player` set → `/choose-your-character`
5. Otherwise: do nothing (user is already where they belong)

## Used by

- [`app/(pages)/login.tsx`](../../app/(pages)/login.md)
- [`app/index.tsx`](../../app/index.md)
