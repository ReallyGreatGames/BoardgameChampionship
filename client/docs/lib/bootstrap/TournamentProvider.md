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
| `locale` | `"en" \| "de"` | The current tournament's configured language. |
| `active` | `boolean` | Whether any tournament document is currently marked `active` (i.e. public PIN login is open). |
| `type` | `"dmmib" \| "europemasters"` | Branding of the current tournament — the active row's `type`; when no row is active, the most recently created row's `type`. |

Default value, used only when the collection is empty (no tournament
document at all): `{ locale: "en", active: false, type: "europemasters" }`.

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
is `useTournamentStore((s) => s.collection)`. It picks the "current"
tournament via `currentTournament(collection)`: the document with
`active === true` if one exists, otherwise the most recently created
document (`$createdAt` descending). If neither exists (empty collection) it
falls back to `DEFAULT_TOURNAMENT_INFO`. It then mirrors that row's
`locale`/`type` into the result while setting `active` from whether *any*
row is active.

This two-part split matters: branding (`type`, driving the logo and the
`menu:*` label) should always reflect the configured tournament, but the
`active` flag alone controls whether PIN login is open. Reading only the
active row would drop back to the hardcoded default branding whenever an
event is inactive (public login disabled), showing the wrong event's logo.
Memoizing on `collection` means this only recomputes when the store's
collection reference actually changes (e.g. a realtime update to the
tournament collection), not on every render of whatever mounts
`TournamentProvider`.

A separate `useEffect`, deps `[info.active, info.locale, i18n]`, calls
`i18n.changeLanguage(info.locale)` whenever an active tournament's locale
is resolved — meaning the tournament document's configured locale can
override whatever language a device otherwise had selected (see
[`lib/i18n/i18n.ts`](../i18n/i18n.md) for how the initial language is
chosen at startup). The effect is a no-op when `info.active` is `false`,
so losing an active tournament doesn't force the language back — the last
resolved locale sticks until a new active tournament sets one.

## Used by

- [`lib/auth.tsx`](../auth.md) — the forced-logout-when-inactive effect (`active`)
- [`app/(pages)/login.tsx`](../../app/(pages)/login.md) — disables the PIN form when inactive (`active`), and [`app/_layout.tsx`](../../app/_layout.md) (`type`)
- [`lib/components/onboarding/WelcomeScreen.tsx`](../components/onboarding/WelcomeScreen.md) (`active`), [`lib/components/onboarding/WelcomeHero.tsx`](../components/onboarding/WelcomeHero.md) and [`lib/components/home/ParticipantHero.tsx`](../components/home/ParticipantHero.md) (branding logo/label, `type`)
- [`app/(pages)/settings.tsx`](../../app/(pages)/settings.md), [`app/(pages)/legal.tsx`](../../app/(pages)/legal.md), [`app/(pages)/info.tsx`](../../app/(pages)/info.md), [`app/(pages)/(team-player)/choose-your-character.tsx`](../../app/(pages)/(team-player)/choose-your-character.md), [`lib/components/participants/ParticipantListHeader.tsx`](../components/participants/ParticipantListHeader.md) (all `type`)
- [`lib/bootstrap/BootstrapProvider.tsx`](BootstrapProvider.md) — mounts the provider
