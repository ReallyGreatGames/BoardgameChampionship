# `lib/components/shell/AppDrawer.tsx`

[← lib/components/shell](README.md)

## Purpose

Content of the app's navigation drawer (`@react-navigation/drawer`):
header, role-gated nav entries, and a footer with settings/login-logout.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `AppDrawer` (component) | `AppDrawer(props: DrawerContentComponentProps): JSX` | Custom drawer content for `@react-navigation/drawer`: header, role-gated nav entry list, spacer, footer. `props` is spread onto `DrawerContentScrollView` unchanged. |

### Props

`DrawerContentComponentProps` (from `@react-navigation/drawer` — passed
through to `DrawerContentScrollView`); this component reads no props of
its own beyond that.

### Local (unexported) helpers

| Function | Signature | Behavior |
|---|---|---|
| `DrawerHeader` | `DrawerHeader(): JSX` | Renders the drawer title and an info icon that navigates to `/(pages)/info`. |
| `DrawerFooter` | `DrawerFooter(): JSX` | Renders the settings and login/logout icon buttons. |
| `handleAuthPress` (inside `DrawerFooter`) | `handleAuthPress(): Promise<void>` | If a `user` is signed in, calls `logout()` then replaces the route with `/(pages)/login`; otherwise pushes `/(pages)/login` directly (no logout call needed since there's no session). |

### Derived values

| Value | Type | Computed as |
|---|---|---|
| `activeBellCount` | `number` | Count of entries in `bellCollection` (from `useTableBellStore`) whose `acknowledgeTime` is falsy, i.e. unacknowledged table bells. Recomputed on `[bellCollection]`. |
| `entries` | array of `{ translationId, route, icon, scope, badgeCount }` | Recomputed fresh every render (not memoized) — the static list of the five nav entries (home, schedule, participants, active bells, dashboard), each with a `scope` ("public"/"private"/"admin") and an optional `badgeCount`. Only the "active bells" entry gets a non-`undefined` `badgeCount` (`activeBellCount`, admins only). |

## How it works

Each nav entry declares a `scope`: `"public"` (always shown), `"private"`
(shown once `isPinVerified || isAdmin`), or `"admin"` (admin only) — see
[`useAuth`](../../auth.md). The `entries` array is filtered against this
scope/role logic before being mapped to `DrawerItem`s, so entries the
current user can't access are never rendered at all (not just disabled).
The "active bells" entry shows a badge with the count of unacknowledged
[`TableBell`](../../models/table-bell.md)s, but only for admins
(`isAdmin ? activeBellCount : undefined`); a `DrawerItem`'s `label` is
rendered as a function returning either a plain label or a label-plus-badge
row depending on whether `badgeCount !== undefined`, and the badge itself
only shows once `badgeCount! > 0` (a defined-but-zero count still shows no
badge).

`DrawerHeader` and `DrawerFooter` are local, unexported helpers — the
footer's auth button logs out (if signed in) or navigates to login (if not).

Every navigation out of the drawer (a nav entry, the info icon, the settings
icon) first calls [`resetBackHistory`](../../utils/navigation.md): jumping
from the menu starts a new path rather than continuing one, so the origins
recorded for the previous flow must not send a later back press somewhere
unrelated.

## Used by

- [`app/_layout.tsx`](../../../app/_layout.md)
