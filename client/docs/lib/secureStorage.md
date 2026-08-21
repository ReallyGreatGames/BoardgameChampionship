# `lib/secureStorage.ts`

[← docs](../README.md)

## Purpose

Cross-platform key-value storage: `expo-secure-store` on native platforms,
`localStorage` on the web (where `SecureStore` isn't available).

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `setItemAsync(key, value)` | `(key: string, value: string) => Promise<void>` | Store `value` under `key`. |
| `getItemAsync(key)` | `(key: string) => Promise<string \| null>` | Read the value stored under `key`, or `null` if absent (or unavailable). |
| `deleteItemAsync(key)` | `(key: string) => Promise<void>` | Remove the value stored under `key`. |

All three share the same `key`/`value` semantics: `key` is any string
identifier, `value` (for `setItemAsync`) is the string to persist — callers
are responsible for serializing non-string data (e.g. `JSON.stringify`)
before calling. Each function resolves once the underlying storage write/read
has completed (synchronous `localStorage` calls resolve immediately;
`expo-secure-store` calls await the native bridge).

## How it works

Detects at module-load time whether `localStorage` is available
(`Platform.OS === "web"` and `typeof localStorage !== "undefined"`) via the
`hasLocalStorage` constant, and routes all three functions accordingly:
`localStorage.setItem/getItem/removeItem` when true, otherwise
`SecureStore.setItemAsync/getItemAsync/deleteItemAsync` when
`Platform.OS !== "web"`. On web without `localStorage` support (SSR, where
`window`/`localStorage` don't exist), `setItemAsync` and `deleteItemAsync`
silently no-op and `getItemAsync` resolves to `null` — this keeps callers
(e.g. `lib/auth.tsx`, `PlayerProvider`) safe to call unconditionally during
server-side rendering without guarding on platform themselves.

## Used by

- [`lib/auth.tsx`](auth.md)
- [`lib/bootstrap/PlayerProvider.tsx`](bootstrap/PlayerProvider.md)
- [`lib/bootstrap/ThemeProvider.tsx`](bootstrap/ThemeProvider.md)
- [`lib/hooks/useSecureStoragePerGame.ts`](hooks/useSecureStoragePerGame.md)
- [`lib/i18n/i18n.ts`](i18n/i18n.md)
- Screens: [`choose-your-character.tsx`](../app/(pages)/(team-player)/choose-your-character.md), [`game.tsx`](../app/(pages)/(user)/game.md), [`settings.tsx`](../app/(pages)/settings.md)
