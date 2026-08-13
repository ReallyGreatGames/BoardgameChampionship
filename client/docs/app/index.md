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

## How it works

An effect calls [`useRouter`](../lib/routing/useRouter.md)'s
`routeDeterministic()` once auth finishes loading — this is what actually
redirects an admin to `/admin` or a player with no team yet to
`/choose-your-character`; this screen's own JSX below that effect is what
renders while no redirect applies (or momentarily before one fires).

`upcomingItems` takes up to 3 items after the currently-active one (or from
the start if nothing's active), filtering out already-finished ones.

## Related

- [`lib/auth.tsx`](../lib/auth.md), [`lib/routing/useRouter.ts`](../lib/routing/useRouter.md)
- [`lib/stores/appwrite/schedule-store.ts`](../lib/stores/appwrite/schedule-store.md)
