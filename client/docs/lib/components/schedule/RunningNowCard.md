# `lib/components/schedule/RunningNowCard.tsx`

[← lib/components/schedule](README.md)

## Purpose

The currently running schedule item, pulled out of the list and rendered
as the page's lead card: live label, planned duration, large title, progress
bar with remaining minutes, the player's table, description, "go to game",
and (for admins) edit / pause-resume / start-next actions. Shows no fixed
clock time — items are admin-paced, not scheduled to a time of day — only
how long the item is planned to take and (via the progress bar) how much of
that is left, or a "Paused" state in place of both while paused.

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
| `onTogglePause` | `() => void` | Calls the caller's pause or resume handler, whichever `isPaused` currently calls for. |
| `isPaused` | `boolean` | Whether the item is currently paused — swaps the pause button's icon and `accessibilityLabel` between "Pause" and "Resume". |
| `disabled` | `boolean` | Disables all three buttons while a store write is in flight. |

## How it works

### Progress and remaining time

Both come from [`useRoundCountdown`](../../hooks/useRoundCountdown.md),
which ticks once a second off the item's `activeAccumulatedMs`/
`activeResumedAt` bookkeeping (see [`Schedule.tsx`](Schedule.md)'s
"Pausing the active item") rather than any fixed clock time. `progress` is
`(total - secondsLeft) / total` clamped to `0…1`, so it holds at a full bar
in overtime instead of overflowing. While `countdown.isPaused`, the
`remaining` caption shows `schedule.paused` ("Paused") instead of the
minutes-left/overtime text — the progress bar itself needs no special
paused handling, since `secondsLeft` (and so `progress`) is already frozen
by the hook.

### The live label

The top-left label (dot + text) reflects `countdown.isPaused` as a unit, not
just the dot: while paused, the text itself swaps from `schedule.runningNow`
("Running now") to `schedule.paused` ("Paused") and its color drops from
`colors.success` (green) to `colors.textMuted`, so "Paused" never sits next
to a green "Running now" label — the two would otherwise contradict each
other.

### `LiveDot`

A local 8px dot with a ping ring, `paused`-aware: while `countdown.isPaused`
it's passed `paused` (skips the pulse animation entirely, rendering a
static, muted-color dot — the ring's `opacity` Animated.Value starts at `0`
and is never driven, so no ring ever appears) and a muted `color`, so it
doesn't read as "live" while nothing is ticking. Unpaused, it behaves as
before: the ping is a recursive `pulse()` that resets scale/opacity before
each cycle and re-arms itself from the animation's `finished` callback —
`Animated.loop` doesn't reset the values cleanly between iterations. It
pulses for as long as the card is mounted and not paused.

### "Start next" styling

The [`Button`](../ui/Button.md) has no success variant, so the button uses
`variant="primary"` (which gives it the white `onAccent` foreground) with
`colors.success` overridden through `style`.

### `AdminIconButton`: Edit and pause/resume are icon-only, not `Button`s

The admin row can hold up to three controls (Edit, pause/resume, Start
next). With all three as full `Button`s their labels wrapped ("Start next"
in particular) once the row got tight — three `flex: 1` buttons don't leave
enough width for their longer labels. Edit and pause/resume are instead
`AdminIconButton`, a local fixed-44×44 icon-only `Pressable` (same
square-icon-button shape as [`ScheduleRow`](ScheduleRow.md)'s
`IconAction`, not shared as a component since each is a one-off local
helper) — so only Start next, the one action worth foregrounding, is a
full-width `Button`; the other two ride along at a fixed size beside it.
Pause/resume's icon and `accessibilityLabel` both swap between
"Pause"/"Resume" off `admin.isPaused`.

## Used by

- [`Schedule.tsx`](Schedule.md)

## Related

- [`ScheduleRow.tsx`](ScheduleRow.md) — the collapsed form used for every other item
- [`useOpenGame.ts`](useOpenGame.md) — the "go to game" navigation
- [`lib/components/game/Table.tsx`](../game/Table.md) — the embedded seating table
