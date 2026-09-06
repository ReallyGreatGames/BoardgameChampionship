# `lib/components/home/ParticipantHero.tsx`

[← lib/components/home](README.md)

## Purpose

The participant start page's branded header: a drawer-opening menu button,
the tournament logo, the tournament name, a personal greeting, and the
player's team. It replaces the navigator's own header on the home screen
(see [`app/index.tsx`](../../../app/index.md)), which is why it draws its
own menu affordance and its own status-bar padding.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `ParticipantHero` (component) | `ParticipantHero({ onMenuPress: () => void }): JSX.Element` | Renders the hero band at the top of the home screen. |

### Props

| Prop | Type | Meaning |
|---|---|---|
| `onMenuPress` | `() => void` | Called when the hamburger button is pressed; the screen wires this to opening the navigation drawer. |

### Module constants

| Constant | Type | Meaning |
|---|---|---|
| `LOGOS` | `Partial<Record<string, number>>` | Tournament type → bundled logo asset (`dmmib`, `europemasters`), the same mapping [`WelcomeScreen`](../onboarding/WelcomeScreen.md) uses. |

## How it works

### Reading its own data

The hero takes only `onMenuPress` as a prop and reads everything else from
context: the player from [`usePlayer`](../../bootstrap/PlayerProvider.md)
and the tournament type from [`useTournament`](../../bootstrap/TournamentProvider.md).
Its content is the same on every screen that would ever show it, so
threading five display props through the screen would buy nothing.

The greeting uses only the first whitespace-separated token of the
player's name ("Hello, Lena" reads better than "Hello, Lena Brandt"), and
falls back to the plain `welcome` string when no player is selected yet.

### Colors across schemes

The design calls for a saturated `primary` band with light text — which
works in the light and high-contrast palettes, where `primary` is a deep
blue, but not in the dark/OLED ones, where `primary` is a *light* blue
that white text disappears into. So the hero picks its three colors from
`isDark` ([`useTheme`](../../bootstrap/ThemeProvider.md)): dark schemes get
`surface`/`text`/`textSecondary` (a raised band, the standard dark
treatment), light ones get `primary`/`onAccent`/`surfaceHigh`.

### Status bar

The top padding is `useSafeAreaInsets().top` plus a small gap, because the
hero is the topmost element on a screen with no navigator header — without
it the menu button would sit under the status bar/notch.

## Used by

- [`app/index.tsx`](../../../app/index.md)

## Related

- [`lib/components/onboarding/WelcomeScreen.tsx`](../onboarding/WelcomeScreen.md) — the logged-out counterpart, sharing the logo mapping
