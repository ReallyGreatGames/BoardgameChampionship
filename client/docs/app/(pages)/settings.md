# `app/(pages)/settings.tsx`

[← app](../README.md)

## Route

`/settings`.

## Purpose

Color scheme, language, account (change team/player), legal notice link,
and (dev builds only) a destructive local-data reset.

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `SettingsScreen` (default) | `(): JSX.Element` | Screen component for `/settings`. Renders appearance (color scheme), language, an optional dev-only debug-reset section, an optional account section (only when logged in), and a link to `/legal`. |

### Types

| Type | Definition | Meaning |
| --- | --- | --- |
| `Language` | `"en" \| "de"` | Supported UI language codes, used for `LANGUAGES` and the language picker's value type. |

### Module constants

| Constant | Type | Meaning |
| --- | --- | --- |
| `LANGUAGES` | `Language[]` | `["en", "de"]` — options for the language `SelectPicker`. |
| `SCHEMES` | `ColorScheme[]` | `["light", "dark", "oled", "highContrast"]` — options for the color-scheme `SelectPicker`. |

### `handleDebugReset(): Promise<void>`

Shows a native `Alert.alert` confirmation ("Ultimate Debug Reset"); if the user confirms ("Nuke it"), clears the stored player via `clearPlayer()`, deletes the stored PIN (`SecureStorage.deleteItemAsync(PIN_STORE_KEY)`), and calls `logout()` if a `user` session exists. Only reachable via the `__DEV__`-gated debug section, so it never ships to production builds.

### `makeStyles(colors: ReturnType<typeof useTheme>["colors"]): StyleSheet`

Builds all row/card/section styles from theme colors; memoized via `useMemo` on `colors`.

## How it works

`__DEV__ &&` gates the "Ultimate Debug Reset" section entirely out of
production builds — it clears the stored player, deletes the stored PIN
([`PIN_STORE_KEY`](../../lib/auth.md)), and logs out if a session exists,
behind a native `Alert.alert` confirmation (not the app's own
[`Dialog`](../../lib/components/ui/Dialog.md), unusually — this one predates
or intentionally bypasses that convention).

The account section (change team/player via
[`PlayerSelectionCard`](../../lib/components/ui/PlayerSelectionCard.md))
only shows when `user` is set.

## Related

- [`lib/bootstrap/ThemeProvider.tsx`](../../lib/bootstrap/ThemeProvider.md), [`lib/i18n/i18n.ts`](../../lib/i18n/i18n.md)
- [`lib/bootstrap/PlayerProvider.tsx`](../../lib/bootstrap/PlayerProvider.md)
