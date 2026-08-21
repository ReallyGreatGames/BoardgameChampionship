# `lib/bootstrap/TournamentProvider.tsx`

[← lib/bootstrap](README.md)

## Purpose

Derives a simple "is there an active tournament, and what's its
locale/type" summary from the raw
[`useTournamentStore`](../stores/appwrite/tournament-store.md) collection,
and keeps `i18next`'s active language in sync with it.

## Exports

### `ActiveTournamentInfo`

| Property | Type | Meaning |
|---|---|---|
| `locale` | `"en" \| "de"` | The active tournament's configured language. |
| `active` | `boolean` | Whether any tournament document is currently marked `active`. |
| `type` | `"dmmib" \| "europemasters"` | Which tournament format/branding is active. |

Default value when no document is `active`:
`{ locale: "en", active: false, type: "dmmib" }`.

### `useTournament(): ActiveTournamentInfo`

No parameters. Thin `useContext(tournamentContext)` wrapper; returns
whatever value the nearest `TournamentProvider` currently provides (or the
default stub above if none is mounted).

### `TournamentProvider(props: PropsWithChildren): JSX.Element`

`props.children: ReactNode` — the subtree given access to
`tournamentContext`. Derives `info` from the tournament store's
collection and keeps `i18next` in sync with it (see below).

## How it works

`info` is computed with `useMemo`, deps `[collection]`, where `collection`
is `useTournamentStore((s) => s.collection)`. It finds the one
`Tournament` document with `active === true` (there should be at most
one). If found, it mirrors that row's `locale`/`type` into
`{ active: true, locale, type }`; otherwise it falls back to
`DEFAULT_TOURNAMENT_INFO`. Memoizing on `collection` means this only
recomputes when the store's collection reference actually changes (e.g. a
realtime update to the tournament collection), not on every render of
whatever mounts `TournamentProvider`.

A separate `useEffect`, deps `[info.active, info.locale, i18n]`, calls
`i18n.changeLanguage(info.locale)` whenever an active tournament's locale
is resolved — meaning the tournament document's configured locale can
override whatever language a device otherwise had selected (see
[`lib/i18n/i18n.ts`](../i18n/i18n.md) for how the initial language is
chosen at startup). The effect is a no-op when `info.active` is `false`,
so losing an active tournament doesn't force the language back — the last
resolved locale sticks until a new active tournament sets one.

## Used by

- [`lib/auth.tsx`](../auth.md) — the forced-logout-when-inactive effect
- [`app/(pages)/login.tsx`](../../app/(pages)/login.md), [`app/_layout.tsx`](../../app/_layout.md)
- [`lib/components/onboarding/WelcomeScreen.tsx`](../components/onboarding/WelcomeScreen.md)
- [`lib/bootstrap/BootstrapProvider.tsx`](BootstrapProvider.md)
