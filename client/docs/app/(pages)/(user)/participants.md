# `app/(pages)/(user)/participants.tsx`

[← app](../../README.md)

## Purpose

Route `/participants` — the participant directory: every team of the
tournament, grouped by country, with its team code and name. Reached from
the navigation drawer (the "Participants" entry, visible once the user is
PIN-verified or an admin).

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `ParticipantsPage` (default) | `(): JSX.Element \| null` | The screen. Gates on [`useRequireAuth`](../../../lib/hooks/useRequireAuth.md) (returns `null` while loading or signed out), pulls the grouped team list from [`useTeamDirectory`](../../../lib/hooks/useTeamDirectory.md), and renders [`ParticipantListHeader`](../../../lib/components/participants/ParticipantListHeader.md) above [`ParticipantList`](../../../lib/components/participants/ParticipantList.md). |

### Internal

| Value | Signature | Behavior |
|---|---|---|
| `openMenu` | `(): void` | Dispatches `DrawerActions.openDrawer()` on the navigator. Memoized on `[navigation]` and handed to the header's hamburger button. |

## How it works

### No navigator header

The screen is registered in [`app/_layout.tsx`](../../_layout.md) with
`headerShown: false`, because the design puts the page title, the tournament
name, and the team count inside the same colored band as the menu button —
the same arrangement the home screen uses with
[`ParticipantHero`](../../../lib/components/home/ParticipantHero.md). With the
navigator header gone, the drawer would otherwise be unreachable from this
screen, which is why the header component takes `onMenuPress` and the screen
wires it to `DrawerActions.openDrawer()`.

### Where the state lives

Search text and grouping both live in
[`useTeamDirectory`](../../../lib/hooks/useTeamDirectory.md) rather than in the
list component, because the header renders the *result* count — the number of
teams currently matching the search — so both children read from one source
instead of the list reporting its count back upwards.

## Related

- [`lib/hooks/useTeamDirectory.ts`](../../../lib/hooks/useTeamDirectory.md)
- [`lib/components/participants/`](../../../lib/components/participants/README.md)
- [`lib/stores/appwrite/team-store.ts`](../../../lib/stores/appwrite/team-store.md)
