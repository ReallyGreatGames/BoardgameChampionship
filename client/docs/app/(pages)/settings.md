# `app/(pages)/settings.tsx`

[← app](../README.md)

## Route

`/settings`.

## Purpose

Color scheme, language, account (change team/player), legal notice link,
logout, and (dev builds only) a destructive local-data reset. Rendered
under the app's own blue hero header
([`GameHeader`](../../lib/components/game/GameHeader.md)) with a
[`BackButton`](../../lib/components/ui/BackButton.md) — the navigator's
native header is disabled for this route in
[`app/_layout.tsx`](../_layout.md).

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `SettingsScreen` (default) | `(): JSX.Element` | Screen component for `/settings`. Renders the hero header, a back button, then a scrollable list of section cards: appearance (color scheme), language, an optional dev-only debug-reset section, an optional account section (only when logged in), a link to `/legal`, and an optional logout button (only when logged in). |

### Types

| Type | Definition | Meaning |
| --- | --- | --- |
| `Language` | `"en" \| "de"` | Supported UI language codes, used for `LANGUAGES` and the language picker's value type. |

### Module constants

| Constant | Type | Meaning |
| --- | --- | --- |
| `LANGUAGES` | `Language[]` | `["en", "de"]` — options for the language `SelectPicker`. |
| `SCHEMES` | `ColorScheme[]` | `["light", "dark", "oled", "highContrast"]` — options for the color-scheme `SelectPicker`. |

### `handleLogout(): Promise<void>`

Calls `logout()` from [`useAuth`](../../lib/auth.md) and replaces the route
with `/login` — the same flow the drawer footer uses. Only reachable when
`user` is set (the button is not rendered otherwise).

### `handleDebugReset(): Promise<void>`

Shows a native `Alert.alert` confirmation ("Ultimate Debug Reset"); if the user confirms ("Nuke it"), clears the stored player via `clearPlayer()`, deletes the stored PIN (`SecureStorage.deleteItemAsync(PIN_STORE_KEY)`), and calls `logout()` if a `user` session exists. Only reachable via the `__DEV__`-gated debug section, so it never ships to production builds.

### `makeStyles(colors: ReturnType<typeof useTheme>["colors"]): StyleSheet`

Builds container/back-button/scroll/section/card/row/logout styles from theme colors; memoized via `useMemo` on `colors`.

## How it works

The hero subtitle shows `"<player name> · <team name>"` when a player is
selected ([`usePlayer`](../../lib/bootstrap/PlayerProvider.md)), and falls
back to the active tournament's name
(`t("menu:<type>")` via [`useTournament`](../../lib/bootstrap/TournamentProvider.md))
otherwise.

The back button pops the recorded origin via
[`goBackTo("/")`](../../lib/utils/navigation.md); the drawer resets that
history before pushing `/settings`, so from the drawer it lands on home.

`__DEV__ &&` gates the "Ultimate Debug Reset" section entirely out of
production builds — it clears the stored player, deletes the stored PIN
([`PIN_STORE_KEY`](../../lib/auth.md)), and logs out if a session exists,
behind a native `Alert.alert` confirmation (not the app's own
[`Dialog`](../../lib/components/ui/Dialog.md), unusually — this one predates
or intentionally bypasses that convention).

The account section (change team/player via
[`PlayerSelectionCard`](../../lib/components/ui/PlayerSelectionCard.md))
and the logout button only show when `user` is set.

## Related

- [`lib/components/game/GameHeader.tsx`](../../lib/components/game/GameHeader.md)
- [`lib/bootstrap/ThemeProvider.tsx`](../../lib/bootstrap/ThemeProvider.md), [`lib/i18n/i18n.ts`](../../lib/i18n/i18n.md)
- [`lib/bootstrap/PlayerProvider.tsx`](../../lib/bootstrap/PlayerProvider.md)
