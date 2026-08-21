# `lib/components/onboarding/WelcomeScreen.tsx`

[← lib/components/onboarding](README.md)

## Purpose

The home screen's welcome view for logged-out users: tournament logo,
welcome text, a login button, and an FAQ link. Shows a banner if the
tournament isn't currently active.

## Exports

### `WelcomeScreen({ onLoginPress, onFaqPress }: Props): JSX.Element`

| Prop | Type | Meaning |
|---|---|---|
| `onLoginPress` | `() => void` | Called when the login button is pressed. |
| `onFaqPress` | `() => void` | Called when the FAQ link text is pressed. |

## How it works

The displayed logo is picked from a small `LOGOS` map keyed by
[`useTournament()`](../../bootstrap/TournamentProvider.md)'s `type`
(`"dmmib"` or `"europemasters"`) — tournament branding swaps automatically
based on which tournament variant is configured. `logo` is `undefined`
(and no `<Image>` rendered) both when `tournamentType` is falsy and when it
doesn't match a key in `LOGOS`.

When [`useTournament()`](../../bootstrap/TournamentProvider.md)'s `active`
is `false`, an inactive-event banner is shown above the login button —
this doesn't block login, it's informational only.

## Used by

- [`app/index.tsx`](../../../app/index.md)
