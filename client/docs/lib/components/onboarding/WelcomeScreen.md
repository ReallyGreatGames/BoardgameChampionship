# `lib/components/onboarding/WelcomeScreen.tsx`

[← lib/components/onboarding](README.md)

## Purpose

The home screen's welcome view for logged-out users: the branded
[`WelcomeHero`](WelcomeHero.md) band, a short description, a login button,
and an FAQ link. Shows a banner if the tournament isn't currently active.

## Exports

### `WelcomeScreen({ onMenuPress, onLoginPress, onFaqPress }: Props): JSX.Element`

| Prop | Type | Meaning |
|---|---|---|
| `onMenuPress` | `() => void` | Forwarded to the hero's menu button (the navigator header is hidden on this route). |
| `onLoginPress` | `() => void` | Called when the login button is pressed. |
| `onFaqPress` | `() => void` | Called when the FAQ link text is pressed. |

## How it works

Branding (logo, tournament name) lives entirely in `WelcomeHero`; this
component only owns the body below the band. The login button is the
shared [`Button`](../ui/Button.md) with a trailing `arrow-forward` icon
(`iconPosition="right"`), left-aligned rather than full-width.

When [`useTournament()`](../../bootstrap/TournamentProvider.md)'s `active`
is `false`, an inactive-event banner is shown between the description and
the button — this doesn't block navigating to login, it's informational
only; the login screen itself disables the PIN form.

## Used by

- [`app/index.tsx`](../../../app/index.md)
