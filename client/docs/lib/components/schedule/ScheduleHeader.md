# `lib/components/schedule/ScheduleHeader.tsx`

[← lib/components/schedule](README.md)

## Purpose

The schedule screen's hero: drawer button, an eyebrow combining the item
count and the day's total planned duration, the "Zeitplan" title, and an
"Admin" pill for admins. The screen renders this instead of the navigator
header (`headerShown: false` in [`app/_layout.tsx`](../../../app/_layout.md)).

## Exports

### `ScheduleHeader({ count, totalMinutes, isAdmin, onMenuPress }: Props): JSX.Element`

| Prop | Type | Meaning |
|---|---|---|
| `count` | `number` | Number of schedule items; rendered through the `itemCount_one/_other` plural as the first half of the eyebrow. |
| `totalMinutes` | `number` | Sum of every item's `durationPlanned`; rendered as the second half of the eyebrow (see below). |
| `isAdmin` | `boolean` | Whether to show the "Admin" pill. |
| `onMenuPress` | `() => void` | Passed straight to [`MenuButton`](../shell/MenuButton.md); the screen dispatches `DrawerActions.openDrawer()`. |

## How it works

The eyebrow is `t("schedule.itemCount", { count })` plus a duration label,
joined with " · ": `totalMinutes` is split into `hours`/`minutes`, and
renders as `schedule.totalDuration` ("Xh Ymin") when both are non-zero,
`schedule.totalDurationHours` ("Xh") when there's no remainder, or
`schedule.durationMinutes` ("Xmin") when under an hour. This is the
schedule's only "when" signal at the top level — no individual item shows
a fixed clock time (see [`ScheduleRow`](ScheduleRow.md)), so the header
instead surfaces the day's total planned length.

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
