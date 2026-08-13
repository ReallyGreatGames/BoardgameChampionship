# `lib/bootstrap/ThemeProvider.tsx`

[← lib/bootstrap](README.md)

## Purpose

Holds the app's currently active color scheme and exposes it (plus the
resolved color palette) to every component via `useTheme()`. The single
source of truth `lib/theme/colors.ts`'s `colors` fallback export
deliberately isn't (see [that file's docs](../theme/colors.md)).

## Exports

### `useTheme()`

Returns `{ scheme, setScheme(next), isDark, colors }` — `scheme` is a
[`ColorScheme`](../theme/colors.md) (`"light" | "dark" | "oled" |
"highContrast"`), `colors` is the resolved [`Palette`](../theme/colors.md)
object for that scheme, and `isDark` is `true` for both `"dark"` and
`"oled"`.

### `ThemeProvider` (component)

## How it works

On mount, resolves the initial scheme in priority order:

1. A previously-saved scheme under `SCHEME_STORE_KEY` (`"app_color_scheme"`).
2. A legacy boolean preference under `LEGACY_DARK_KEY`
   (`"app_theme_dark"`) — migrated on read into the new scheme key
   (`"true"` → `"dark"`, otherwise `"light"`) and persisted forward under
   the new key, so the migration only ever runs once per device.
3. Otherwise, follows the OS-reported color scheme (`useColorScheme()`) —
   only `"dark"` is honored this way; any other/unknown system value keeps
   the `DEFAULT_SCHEME` (`"light"`).

`setScheme` updates state and persists the choice immediately.

## Used by

Extremely widely used — via `useTheme()`, by nearly every screen and
component in the app (colors, `isDark`-conditional styling). Also used
directly for scheme selection UI by
[`app/(pages)/settings.tsx`](../../app/(pages)/settings.md) and
[`choose-your-character.tsx`](../../app/(pages)/(team-player)/choose-your-character.md).
See [`lib/bootstrap/BootstrapProvider.tsx`](BootstrapProvider.md) for where
it's mounted.

## Related

- [`lib/theme/colors.ts`](../theme/colors.md) — defines the palettes this provider selects between
