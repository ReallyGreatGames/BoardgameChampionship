# `lib/components/schedule/ScheduleHeader.tsx`

[← lib/components/schedule](README.md)

## Purpose

The schedule screen's hero: drawer button, an item-count eyebrow, the
"Zeitplan" title, and an "Admin" pill for admins. The screen renders this
instead of the navigator header (`headerShown: false` in
[`app/_layout.tsx`](../../../app/_layout.md)).

## Exports

### `ScheduleHeader({ count, isAdmin, onMenuPress }: Props): JSX.Element`

| Prop | Type | Meaning |
|---|---|---|
| `count` | `number` | Number of schedule items; rendered through the `itemCount_one/_other` plural as the eyebrow. |
| `isAdmin` | `boolean` | Whether to show the "Admin" pill. |
| `onMenuPress` | `() => void` | Passed straight to [`MenuButton`](../shell/MenuButton.md); the screen dispatches `DrawerActions.openDrawer()`. |

## How it works

Same hero recipe as [`ParticipantListHeader`](../participants/ParticipantListHeader.md)
and [`GameHeader`](../game/GameHeader.md): `colors.primary` ground in light
schemes, `colors.surface` in dark ones, with foreground/muted picked off
the same `isDark` switch so `MenuButton` — which derives its own colors
from that identical assumption — stays legible. Top padding is
`useSafeAreaInsets().top + space[2]`, since the hero paints under the
status bar.

The admin pill inverts the hero: its background is the muted tone and its
text is the hero's own background color, so it reads as a chip cut out of
the header rather than another button.

## Used by

- [`app/(pages)/(user)/schedule.tsx`](../../../app/(pages)/(user)/schedule.md)

## Related

- [`Schedule.tsx`](Schedule.md) — the list rendered beneath this header
