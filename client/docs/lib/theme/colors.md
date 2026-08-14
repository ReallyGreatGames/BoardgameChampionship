# `lib/theme/colors.ts`

[← lib/theme](README.md)

## Purpose

Defines the app's four color palettes as static objects (brand tones).

## Exports

| Export | Type | Meaning |
|---|---|---|
| `dark` | `const` object | Default dark-mode palette |
| `oled` | `const` object | Pure-black theme for OLED displays |
| `light` | `const` object | Light theme |
| `highContrast` | `const` object | High-contrast theme (pastel backgrounds, black text) |
| `ColorScheme` | Type | `"light" \| "dark" \| "oled" \| "highContrast"` |
| `Palette` | Type | Shape of a color-palette object (derived from `dark`) |
| `palettes` | `Record<ColorScheme, Palette>` | All four palettes, addressable by name |
| `colors` | `= dark` | Static fallback; use **outside** React components only (see below) |

Every palette defines the same fields: `background`, `surface`,
`surfaceHigh`, `border`, `borderMuted`, `divider`, `text`, `textSecondary`,
`textMuted`, `textPlaceholder`, `primary`, `secondary`, `accent`, `error`,
`success`, `onAccent`.

**Usage convention:**
- `primary` → interactive chrome (links, back buttons, icons, focused states, identifiers)
- `secondary` → supporting highlights, tags, section labels
- `accent` → CTAs, high-emphasis moments, badges, competitive highlights
- `error` → destructive actions, validation failures

## How it works

`colors` is only a static fallback onto `dark`, for code outside the React
tree (e.g. notification icons). **Inside** components, the currently active
scheme is always obtained via `useTheme()` from
[`ThemeProvider`](../bootstrap/ThemeProvider.md), which consumes `palettes`
and picks the right palette based on the user's setting (see
[`app/(pages)/settings.tsx`](../../app/(pages)/settings.md)).

## Used by

Directly: [`ThemeProvider`](../bootstrap/ThemeProvider.md) (resolving the
active scheme), [`choose-your-character.tsx`](../../app/(pages)/(team-player)/choose-your-character.md),
[`settings.tsx`](../../app/(pages)/settings.md) (scheme-picker UI).

Indirectly (via `useTheme()`): practically every component and screen in the
app — see `ThemeProvider` for the central consumption point.
