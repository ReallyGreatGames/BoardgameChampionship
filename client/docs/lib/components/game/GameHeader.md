# `lib/components/game/GameHeader.tsx`

[← lib/components/game](README.md)

## Purpose

The game page's own screen header: a full-bleed colored hero with the
drawer's hamburger button and the game's name plus its round/table line.
Replaces the drawer navigator's default header on
[`/game`](../../../app/(pages)/(user)/game.md) (that route sets
`headerShown: false`).

## Exports

### `GameHeader(props: Props): JSX.Element`

| Prop | Type | Meaning |
|---|---|---|
| `title` | `string` | The game's display name (the schedule item's title); falls back to the translated `game:title` when empty |
| `round` | `number \| null` | Round number for the meta line; omitted from the line when `null` |
| `tableNumber` | `number \| null` | The player's table for this game; renders `home:tableToBeAnnounced` instead of a number when `null` |
| `onMenuPress` | `() => void` | Called when the hamburger button is pressed — the page dispatches `DrawerActions.openDrawer()` |

## How it works

### Theme inversion

Like [`ParticipantListHeader`](../participants/ParticipantListHeader.md),
the hero paints `colors.primary` with `colors.onAccent` text in light
schemes but switches to `colors.surface`/`colors.text` when `isDark` — a
saturated primary block reads as a bright slab against a near-black
background, so dark schemes get a raised surface instead of a colored one.

### Menu button

The hamburger is the shared [`MenuButton`](../shell/MenuButton.md), caption and all — identical to the home and participants heroes, and on its own line above the title for the same reason: the button keeps its 44×44 tap target without competing with the title for the row.

### Title block

The title and its round/table line sit below the menu row, left-aligned
and inset by `space[2]` — the same alignment the home and participants
heroes give their own titles.

Both title and meta line are `numberOfLines={1}`: long game names ellipsize
rather than pushing the header taller.

### Safe area

`paddingTop` is `insets.top + space[2]` (via `useSafeAreaInsets`) because
the hero is the topmost element on the screen and must clear the status
bar/notch itself.

## Used by

- [`app/(pages)/(user)/game.tsx`](../../../app/(pages)/(user)/game.md)

## Related

- [`lib/components/participants/ParticipantListHeader.tsx`](../participants/ParticipantListHeader.md) — the same hero pattern on the participants screen
- [`lib/hooks/useGameScheduleInfo.ts`](../../hooks/useGameScheduleInfo.md) — supplies `title` and `round`
- [`lib/components/shell/MenuButton.tsx`](../shell/MenuButton.md) — the shared hamburger button
