# `lib/secureStorage.ts`

[← docs](../README.md)

## Purpose

Cross-platform key-value storage: `expo-secure-store` on native platforms,
`localStorage` on the web (where `SecureStore` isn't available).

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `setItemAsync(key, value)` | `(string, string) => Promise<void>` | Store a value |
| `getItemAsync(key)` | `(string) => Promise<string \| null>` | Read a value |
| `deleteItemAsync(key)` | `(string) => Promise<void>` | Delete a value |

## How it works

Detects at module-load time whether `localStorage` is available
(`Platform.OS === "web"` and `typeof localStorage !== "undefined"`) and
routes all three functions accordingly, either to `localStorage` or to
`expo-secure-store`. On web without `localStorage` support (SSR), all
operations are no-ops.

## Used by

- [`lib/auth.tsx`](auth.md)
- [`lib/bootstrap/PlayerProvider.tsx`](bootstrap/PlayerProvider.md)
- [`lib/bootstrap/ThemeProvider.tsx`](bootstrap/ThemeProvider.md)
- [`lib/hooks/useSecureStoragePerGame.ts`](hooks/useSecureStoragePerGame.md)
- [`lib/i18n/i18n.ts`](i18n/i18n.md)
- Screens: [`choose-your-character.tsx`](../app/(pages)/(team-player)/choose-your-character.md), [`game.tsx`](../app/(pages)/(user)/game.md), [`settings.tsx`](../app/(pages)/settings.md)
