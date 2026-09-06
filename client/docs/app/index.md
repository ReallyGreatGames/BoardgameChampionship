# `app/index.tsx`

[← app](README.md)

## Route

`/` — the home screen (the participant start page).

## Purpose

Logged-out users see [`WelcomeScreen`](../lib/components/onboarding/WelcomeScreen.md);
logged-in users see the participant start page: the branded
[`ParticipantHero`](../lib/components/home/ParticipantHero.md), the match
running right now ([`NowPlayingCard`](../lib/components/home/NowPlayingCard.md)),
and their own tournament score so far
([`PlayerScoreSummary`](../lib/components/home/PlayerScoreSummary.md) +
[`PlayerGameList`](../lib/components/home/PlayerGameList.md)). When the
active schedule item isn't a game — a break, a briefing — or nothing is
running at all, the older schedule widgets
([`ActiveScheduleCard`](../lib/components/schedule/ActiveScheduleCard.md),
[`UpcomingList`](../lib/components/schedule/UpcomingList.md)) stand in for
the match card.

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `Index` (default) | `(): JSX.Element` | Screen component for `/`. Logged-out: renders `WelcomeScreen`. Logged-in: renders the hero plus the now-playing, up-next, and results sections described above. Also fires the deterministic post-auth redirect and hides the navigator header (see below). |

### Internal: `openMenu(): void`

`useCallback` keyed on `[navigation]`. Dispatches `DrawerActions.openDrawer()`; passed to `ParticipantHero` as `onMenuPress`, since the hero draws the hamburger the hidden navigator header would otherwise provide.

## How it works

An effect calls [`useRouter`](../lib/routing/useRouter.md)'s
`routeDeterministic()` once auth finishes loading — this is what actually
redirects an admin to `/admin` or a player with no team yet to
`/choose-your-character`; this screen's own JSX below that effect is what
renders while no redirect applies (or momentarily before one fires). The effect depends on `[user, loading, isAdmin, isPinVerified, routeDeterministic]` and bails out early while `loading` is true, so it only ever evaluates the redirect once auth state has fully settled, and re-evaluates whenever any of those auth facts change (e.g. PIN verification completing mid-session).

### Header ownership

A second effect calls `navigation.setOptions({ headerShown: !user })`
rather than the route declaring a fixed `headerShown` in
[`app/_layout.tsx`](_layout.md): the logged-in start page draws its own
hero band (with its own menu button and status-bar padding) all the way to
the top of the screen, while the logged-out `WelcomeScreen` has no such
band and still needs the navigator's header to reach the drawer.

### Screen data

Everything the participant sections render comes from a single
[`useParticipantOverview()`](../lib/hooks/useParticipantOverview.md) call —
the active item, the current match with its opponents, and the per-game
entries with placements and points.

`upcomingItems` (`useMemo`, deps `[collection]`) is the one piece of state
still derived here: it sorts the raw schedule collection by `sortIndex`,
takes up to 3 items after the currently-active one (or from the start if
nothing's active), and filters out already-finished ones. It's only
rendered when there is no current match — mid-round, the results list
already shows what's coming, and the round countdown is what matters.

## Related

- [`lib/auth.tsx`](../lib/auth.md), [`lib/routing/useRouter.ts`](../lib/routing/useRouter.md)
- [`lib/stores/appwrite/schedule-store.ts`](../lib/stores/appwrite/schedule-store.md)
- [`lib/components/home/`](../lib/components/home/README.md)
