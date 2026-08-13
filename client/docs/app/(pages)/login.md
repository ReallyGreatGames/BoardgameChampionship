# `app/(pages)/login.tsx`

[← app](../README.md)

## Route

`/login`.

## Purpose

Two logins in one screen: a PIN field for participants (default), and a
hidden email/password admin form revealed by a secret gesture.

## How it works

### Admin mode reveal

Tapping the screen title `SECRET_TAPS` (7) times within a rolling 2-second
window (`tapTimer`, reset on every tap) toggles `adminMode`. This is a
deliberately undiscoverable gesture — there's no visible admin-login
button — so this screen also carries a small entrance animation
(`badgeAnim`, spring) revealing an "ADMIN MODE" badge once triggered.

### Event-inactive gating

While the tournament isn't active
([`useTournament`](../../lib/bootstrap/TournamentProvider.md)) and the user
isn't in admin mode, the PIN field and submit button are disabled
(`eventInactive`) with a hint linking to the FAQ — admins can always still
log in via their own form regardless of tournament active-state.

### Already-logged-in redirect

`useFocusEffect` redirects to `/` immediately if `user` is already set —
this screen is unreachable once logged in except by manually navigating
back to it.

## Related

- [`lib/auth.tsx`](../../lib/auth.md) — `login`, `loginWithPin`
- [`lib/routing/useRouter.ts`](../../lib/routing/useRouter.md)
