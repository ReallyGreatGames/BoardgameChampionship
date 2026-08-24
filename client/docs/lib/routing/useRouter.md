# `lib/routing/useRouter.ts`

[← lib/routing](README.md)

## Purpose

Small wrapper around `expo-router` that provides a single central rule for
where a user should be routed based on auth/player state.

## Exports

### `useRouter(): { navigate: (path: Href, options?: NavigationOptions) => void; routeDeterministic: () => void }`

Reads `user`, `isAdmin`, `isPinVerified` from [`useAuth`](../auth.md) and
`player`, `playerLoading` from [`usePlayer`](../bootstrap/PlayerProvider.md).
Returns:

| Function | Signature | Purpose |
|---|---|---|
| `navigate` | `(path: Href, options?: NavigationOptions) => void` | Thin wrapper around `expo-router`'s `router.navigate(path, options)`. `path` is any `expo-router` `Href` (string route or route object); `options` is `expo-router`'s `NavigationOptions` (e.g. navigation-behavior flags) and is optional. |
| `routeDeterministic` | `() => void` | Evaluates the current auth/player state and, if the user is not already on the correct screen, calls `navigate` to send them there. Takes no arguments and returns nothing — see below for the decision order. |

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
