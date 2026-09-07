# `lib/components/schedule/RunningNowCard.tsx`

[← lib/components/schedule](README.md)

## Purpose

The currently running schedule item, pulled out of the list and rendered
as the page's lead card: live label, time range, large title, progress bar
with remaining minutes, the player's table, description, "go to game", and
(for admins) edit / start-next actions.

Not to be confused with [`ActiveScheduleCard`](ActiveScheduleCard.md),
which is the much smaller home-screen widget for the same item.

## Exports

### `RunningNowCard({ item, admin }: Props): JSX.Element`

| Prop | Type | Meaning |
|---|---|---|
| `item` | `Schedule` | The active item. The caller decides what "active" means — this component does not check `isActive`. |
| `admin` | `RunningNowAdmin \| undefined` | Omitted for non-admins; present renders the bottom action row. |

### `RunningNowAdmin`

| Property | Type | Meaning |
|---|---|---|
| `onEdit` | `() => void` | Opens the edit modal for this item. |
| `onStartNext` | `(() => void) \| null` | Activates the following item. `null` when the active item is the last one, which hides the button entirely. |
| `disabled` | `boolean` | Disables both buttons while a store write is in flight. |

## How it works

### Progress and remaining time

Both come from [`useRoundCountdown`](../../hooks/useRoundCountdown.md),
which ticks once a second off the item's planned start and duration.
`progress` is `(total - secondsLeft) / total` clamped to `0…1`, so it
holds at a full bar in overtime instead of overflowing; the caption
switches to the `schedule.overtime` string at the same moment.

### `LiveDot`

A local 8px dot with a ping ring. As in the old timeline's `PulsingDot`,
the ping is a recursive `pulse()` that resets scale/opacity before each
cycle and re-arms itself from the animation's `finished` callback —
`Animated.loop` doesn't reset the values cleanly between iterations. It
runs for as long as the card is mounted, since the card only exists while
an item is running.

### "Start next" styling

The [`Button`](../ui/Button.md) has no success variant, so the button uses
`variant="primary"` (which gives it the white `onAccent` foreground) with
`colors.success` overridden through `style`.

## Used by

- [`Schedule.tsx`](Schedule.md)

## Related

- [`ScheduleRow.tsx`](ScheduleRow.md) — the collapsed form used for every other item
- [`useOpenGame.ts`](useOpenGame.md) — the "go to game" navigation
- [`lib/components/game/Table.tsx`](../game/Table.md) — the embedded seating table
