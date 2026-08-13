# `lib/components/schedule/Schedule.tsx`

[← lib/components/schedule](README.md)

## Purpose

The full tournament schedule as a vertical timeline, with per-item
expand/collapse and (for admins) inline reordering, activation, editing,
and deletion. The single richest component in the schedule feature.

## Exports

| Export | Purpose |
|---|---|
| `ScheduleList` (component) | No props — reads the schedule store itself; the component actually mounted by screens |
| `ScheduleItem` (component) | Props: `{ schedule: Schedule, admin?: AdminActions }` — one timeline row, exported so it can in principle be reused standalone |

`AdminActions` (not exported, but part of `ScheduleItem`'s prop shape):
`{ onMoveUp, onMoveDown, onSetActive, onEdit, onDelete, isFirst, isLast,
disabled, canSetActive }`.

## How it works

### Timeline visuals

Each row has a pulsing dot (`PulsingDot`, local helper) indicating state:
gray/accent for upcoming, a pinging green dot for the active item, plain
for finished. `Animated.loop` isn't used for the pulse because it doesn't
reset values between iterations cleanly — instead a recursive `pulse()`
callback explicitly resets scale/opacity before each cycle and re-triggers
itself via the animation's `finished` callback.

### Expand/collapse

`ScheduleItem` tracks its own `expanded` state, defaulting to the item's
`isActive` flag. A `prevIsActiveRef`-gated effect auto-expands (with a
`LayoutAnimation`) the moment an item transitions from inactive to active —
but doesn't force-collapse it if the admin manually expanded/collapsed it
otherwise, since that effect only fires on the actual `false → true` edge.

### Admin reordering (`handleMoveUp`/`handleMoveDown`)

Swaps `sortIndex` between the item and its neighbor via two parallel
`update` calls. A 2-second `debounceTimeOut` disables all admin buttons
after any such update: [`real-time-store.ts`](../../stores/real-time-store.md)'s
event dedup logic can cause a same-document update fired again within a
few seconds of a prior one to be silently dropped, which would otherwise
leave `sortIndex` out of sync with the actually-applied order if an admin
clicked the reorder buttons rapidly.

### Setting the active item (`handleSetActive`)

Before activating a different item, checks whether the *currently* active
item's game already has recorded results with signatures — if the game has
no tables at all, it checks for any submitted signature; otherwise it
requires every table for that game to have a submitted result. If so, an
extra, more strongly-worded confirmation
(`confirmSetActiveWithSignatures`) is shown on top of the normal
`confirmSetActive` prompt, since moving on discards visibility into an
already-signed-off game. The previously active item is marked `isFinished`
only if its position is at or before the new active index (moving
*backward* to reactivate an earlier item doesn't retroactively mark a
later one finished).

### Modals

Renders both [`ScheduleItemModal`](ScheduleItemModal.md) (add/edit an
item) and [`TimerSettingsModal`](TimerSettingsModal.md) (opened via the
item modal's "timer" action) as children, wiring their save callbacks back
into this component's own store calls.

## Used by

- [`app/(pages)/(admin)/admin/index.tsx`](../../../app/(pages)/(admin)/admin/index.md)
- [`app/(pages)/(user)/schedule.tsx`](../../../app/(pages)/(user)/schedule.md)

## Related

- [`lib/stores/appwrite/schedule-store.ts`](../../stores/appwrite/schedule-store.md), [`result-store.ts`](../../stores/appwrite/result-store.md), [`table-store.ts`](../../stores/appwrite/table-store.md)
- [`lib/components/game/Table.tsx`](../game/Table.md) — rendered inside an expanded item with a game
