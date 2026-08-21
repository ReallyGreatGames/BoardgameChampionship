# `app/index.tsx`

[← app](README.md)

## Route

`/` — the home screen.

## Purpose

Logged-out users see [`WelcomeScreen`](../lib/components/onboarding/WelcomeScreen.md);
logged-in users see the active schedule item
([`ActiveScheduleCard`](../lib/components/schedule/ActiveScheduleCard.md))
plus the next few upcoming items
([`UpcomingList`](../lib/components/schedule/UpcomingList.md)).

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `Index` (default) | `(): JSX.Element` | Screen component for `/`. Logged-out: renders `WelcomeScreen`. Logged-in: renders the active schedule item plus up to 3 upcoming ones, or a "no schedule" message if there's neither. Also fires the deterministic post-auth redirect (see below). |

## How it works

An effect calls [`useRouter`](../lib/routing/useRouter.md)'s
`routeDeterministic()` once auth finishes loading — this is what actually
redirects an admin to `/admin` or a player with no team yet to
`/choose-your-character`; this screen's own JSX below that effect is what
renders while no redirect applies (or momentarily before one fires). The effect depends on `[user, loading, isAdmin, isPinVerified, routeDeterministic]` and bails out early while `loading` is true, so it only ever evaluates the redirect once auth state has fully settled, and re-evaluates whenever any of those auth facts change (e.g. PIN verification completing mid-session).

`sortedItems` (`useMemo`, deps `[collection]`) sorts the raw schedule collection by `sortIndex` once per collection change, so downstream memos don't re-sort on every render.

`activeItem` (`useMemo`, deps `[sortedItems]`) finds the single schedule item flagged `isActive`.

`upcomingItems` (`useMemo`, deps `[sortedItems]`) takes up to 3 items after the currently-active one (or from the start if nothing's active), filtering out already-finished ones (`!s.isFinished`). Locating `activeIndex` by scanning `sortedItems` again (rather than reusing `activeItem`) keeps the slice logic self-contained and correct even if `activeItem` is `undefined`.

## Related

- [`lib/auth.tsx`](../lib/auth.md), [`lib/routing/useRouter.ts`](../lib/routing/useRouter.md)
- [`lib/stores/appwrite/schedule-store.ts`](../lib/stores/appwrite/schedule-store.md)
