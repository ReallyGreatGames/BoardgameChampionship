# `lib/components/schedule/ScheduleRow.tsx`

[← lib/components/schedule](README.md)

## Purpose

One non-running schedule entry: a tappable header (start time, duration,
icon, title, chevron), an expandable body (time range, seating table,
description, "go to game"), and an optional admin action bar. Used for
both groups of [`Schedule.tsx`](Schedule.md)'s list — "up next" and
"done" — with `variant` deciding the treatment.

## Exports

### `ScheduleRow({ schedule, variant, admin }: Props): JSX.Element`

| Prop | Type | Meaning |
|---|---|---|
| `schedule` | `Schedule` | The item to render. |
| `variant` | `"upcoming" \| "done"` | Drives every visual difference (see below) and whether the activate button reads "start" or "restart". |
| `admin` | `ScheduleRowAdmin \| undefined` | Omitted for non-admins; present renders the action bar. |

### `ScheduleRowAdmin`

| Property | Type | Meaning |
|---|---|---|
| `onMoveUp` / `onMoveDown` | `(() => void) \| undefined` | Reordering. Passed only for upcoming rows — the done group is not reorderable, and omitting the callback hides the button rather than disabling it. |
| `onSetActive` | `(() => void) \| undefined` | Activates this item — "start" (green, play icon) on an upcoming row, "restart" (primary, undo icon) on a done one. Upcoming rows get it only when the item is actually startable; done rows always do. |
| `onEdit` | `() => void` | Opens the edit modal. |
| `onDelete` | `() => void` | Deletes the item (the caller confirms first). |
| `isFirst` / `isLast` | `boolean` | Position in the *whole* sorted list, not within the group — disables the matching move button. |
| `disabled` | `boolean` | A store write is in flight: greys out every action and shows a spinner in the bar. |

## How it works

### `variant`

`isDone` is derived once and threaded through `makeStyles`, so the two
looks come out of one stylesheet: done rows sit on `colors.background`
with a `divider` border, muted time and title, `type.body` instead of
`type.h3`, and a `checkmark-circle` before the chevron. It also flips the
activate button's icon, color and label.

### Expand/collapse

Local `expanded` state, always starting collapsed — unlike the old
timeline row, which auto-expanded the active item. That behavior moved to
[`RunningNowCard`](RunningNowCard.md), which is always expanded because it
only renders for the running item. Toggling runs a
`LayoutAnimation.configureNext` and animates the chevron 0→180°. The
module sets `UIManager.setLayoutAnimationEnabledExperimental` on Android
at import time, which is also what makes the parent list's "done" section
animate.

### `IconAction`

The square 34×34 icon buttons in the admin bar. Its stylesheet is
module-level (not theme-derived) because only the icon color and the
pressed background depend on the theme, and those are applied inline.

## Used by

- [`Schedule.tsx`](Schedule.md)

## Related

- [`useOpenGame.ts`](useOpenGame.md) — the "go to game" navigation
- [`lib/components/game/Table.tsx`](../game/Table.md) — the embedded seating table
