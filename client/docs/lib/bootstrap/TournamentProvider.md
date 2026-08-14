# `lib/bootstrap/TournamentProvider.tsx`

[← lib/bootstrap](README.md)

## Purpose

Derives a simple "is there an active tournament, and what's its
locale/type" summary from the raw
[`useTournamentStore`](../stores/appwrite/tournament-store.md) collection,
and keeps `i18next`'s active language in sync with it.

## Exports

### `useTournament()`

Returns an `ActiveTournamentInfo`: `{ locale: "en" | "de", active: boolean,
type: "dmmib" | "europemasters" }`. Defaults to
`{ locale: "en", active: false, type: "dmmib" }` when no active tournament
document exists.

### `TournamentProvider` (component)

## How it works

Finds the one `Tournament` document with `active === true` (there should be
at most one). If found, mirrors its `locale`/`type`; otherwise falls back
to the default. A separate effect calls `i18n.changeLanguage(info.locale)`
whenever an active tournament's locale is resolved — meaning the tournament
document's configured locale can override whatever language a device
otherwise had selected (see [`lib/i18n/i18n.ts`](../i18n/i18n.md) for how
the initial language is chosen at startup).

## Used by

- [`lib/auth.tsx`](../auth.md) — the forced-logout-when-inactive effect
- [`app/(pages)/login.tsx`](../../app/(pages)/login.md), [`app/_layout.tsx`](../../app/_layout.md)
- [`lib/components/onboarding/WelcomeScreen.tsx`](../components/onboarding/WelcomeScreen.md)
- [`lib/bootstrap/BootstrapProvider.tsx`](BootstrapProvider.md)
