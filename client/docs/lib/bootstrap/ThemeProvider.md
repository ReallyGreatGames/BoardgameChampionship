# `lib/bootstrap/ThemeProvider.tsx`

[← lib/bootstrap](README.md)

## Purpose

Holds the app's currently active color scheme and exposes it (plus the
resolved color palette) to every component via `useTheme()`. The single
source of truth `lib/theme/colors.ts`'s `colors` fallback export
deliberately isn't (see [that file's docs](../theme/colors.md)).

## Exports

### `ThemeContextValue`

| Property | Type | Meaning |
|---|---|---|
| `scheme` | [`ColorScheme`](../theme/colors.md) (`"light" \| "dark" \| "oled" \| "highContrast"`) | The active color scheme. |
| `setScheme` | `(scheme: ColorScheme) => void` | Switches the active scheme and persists the choice. |
| `isDark` | `boolean` | `true` when `scheme` is `"dark"` or `"oled"`. |
| `colors` | [`Palette`](../theme/colors.md) | The resolved color palette object for `scheme`, i.e. `palettes[scheme]`. |

### `useTheme(): ThemeContextValue`

No parameters. Thin `useContext(ThemeContext)` wrapper; returns whatever
value the nearest `ThemeProvider` currently provides (or the
`DEFAULT_SCHEME`/`"light"` stub if none is mounted).

### `ThemeProvider(props: PropsWithChildren): JSX.Element`

`props.children: ReactNode` — the subtree given access to `ThemeContext`.
Owns the `scheme` state, resolves its initial value on mount (see below),
and memoizes the context value it provides.

### `setScheme(next: ColorScheme): Promise<void>` — `useCallback`, deps `[]`

`next` — the scheme to switch to (`"light" | "dark" | "oled" |
"highContrast"`). Updates `scheme` state immediately, then awaits
persisting it to secure storage under `SCHEME_STORE_KEY`. Typed on
`ThemeContextValue` as `(scheme: ColorScheme) => void` for consumers, but
the actual implementation returns a `Promise<void>` — callers that don't
need to know when the write finished can simply ignore it.

### `isColorScheme(value: string): value is ColorScheme` (internal)

`value` — an arbitrary string, typically read back from secure storage.
A type-guard that returns `true` only for the four known scheme literals;
used to validate/narrow a persisted or legacy value before trusting it as
a `ColorScheme`, so corrupt or outdated storage data never leaks into
state.

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

The context value (`{ scheme, setScheme, isDark, colors }`) is built with
`useMemo` keyed on `[scheme, setScheme]`. Since `setScheme` is itself a
zero-dependency `useCallback` (stable for the provider's lifetime), the
memo in practice only recomputes when `scheme` changes — this keeps every
consumer of `useTheme()` from re-rendering on renders that don't actually
change the scheme (e.g. a parent re-render caused by unrelated state
elsewhere in the tree).

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
