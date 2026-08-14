# `lib/components/onboarding/WelcomeScreen.tsx`

[← lib/components/onboarding](README.md)

## Purpose

The home screen's welcome view for logged-out users: tournament logo,
welcome text, a login button, and an FAQ link. Shows a banner if the
tournament isn't currently active.

## Props

`{ onLoginPress: () => void, onFaqPress: () => void }`

## How it works

The displayed logo is picked from a small `LOGOS` map keyed by
[`useTournament()`](../../bootstrap/TournamentProvider.md)'s `type`
(`"dmmib"` or `"europemasters"`) — tournament branding swaps automatically
based on which tournament variant is configured.

## Used by

- [`app/index.tsx`](../../../app/index.md)
