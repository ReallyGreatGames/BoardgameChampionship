# `app/(pages)/login.tsx`

[← app](../README.md)

## Route

`/login`.

## Purpose

Two logins in one screen: a PIN field for participants (default), and a
hidden email/password admin form revealed by a secret gesture.

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `LoginScreen` (default) | `(): JSX.Element` | Screen component for `/login`. Renders a PIN form (default) or an email/password admin form (`adminMode`), plus the secret-tap reveal gesture and event-inactive gating. |

### Module constants

| Constant | Type | Meaning |
| --- | --- | --- |
| `SECRET_TAPS` | `number` (`7`) | Number of taps on the title within the rolling window required to toggle `adminMode`. |

### `handleTitleTap(): void`

Increments `tapCount` and resets a 2-second `tapTimer` on every tap (so taps must land in quick succession); once `tapCount` reaches `SECRET_TAPS`, resets the counter and toggles `adminMode`. Bound to the screen title's `onPress`.

### `handleLogin(): Promise<void>`

Branches on `adminMode`. Admin branch: validates `email`/`password` are non-empty (shows an error dialog otherwise), calls `login(email, password)`, and on success replaces the route to `/admin`; on failure shows an error dialog with the caught message. PIN branch: bails out silently if `eventInactive`, validates `pin` is non-empty, calls `loginWithPin(pin)`, and on success replaces to `/`; on failure shows an "Invalid PIN" dialog. Sets `loading` around both branches to drive the submit button's spinner.

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

### Admin badge animation

A `useEffect` keyed on `[adminMode, badgeAnim]` resets `badgeAnim` to `0` and, only when `adminMode` becomes true, starts a spring animation driving it to `1` (the badge's opacity/scale) — toggling `adminMode` off snaps the value back to `0` with no reverse animation, since the badge is unmounted at that point anyway (`{adminMode && <Animated.View ...>}`).

## Related

- [`lib/auth.tsx`](../../lib/auth.md) — `login`, `loginWithPin`
- [`lib/routing/useRouter.ts`](../../lib/routing/useRouter.md)
