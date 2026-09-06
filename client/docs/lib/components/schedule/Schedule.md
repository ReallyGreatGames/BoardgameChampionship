# `lib/components/schedule/Schedule.tsx`

[← lib/components/schedule](README.md)

## Purpose

The full tournament schedule as a vertical timeline, with per-item
expand/collapse and (for admins) inline reordering, activation, editing,
and deletion. The single richest component in the schedule feature.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `ScheduleList` (component) | `ScheduleList(): JSX` | No props — reads the schedule/result/table stores itself. Renders the full timeline, the two modals (item edit, timer settings), and (for admins) the trailing "add item" row. The component actually mounted by screens. |
| `ScheduleItem` (component) | `ScheduleItem({ schedule: Schedule, admin?: AdminActions }): JSX` | One timeline row: header (icon, title, time, expand chevron), expandable body (time range, duration, "go to game" button, embedded `Table`, markdown description), and an optional admin action bar. Exported so it can in principle be reused standalone. |

### `AdminActions` (not exported, but part of `ScheduleItem`'s `admin` prop type)

| Property | Type | Meaning |
|---|---|---|
| `onMoveUp` | `() => void` | Invoked when the "move up" button is pressed; swaps this item's `sortIndex` with its predecessor. |
| `onMoveDown` | `() => void` | Invoked when the "move down" button is pressed; swaps this item's `sortIndex` with its successor. |
| `onSetActive` | `() => void` | Invoked when the "set active" button is pressed; makes this item the active schedule item. |
| `onEdit` | `() => void` | Opens the edit modal for this item. |
| `onDelete` | `() => void` | Deletes this item (after confirmation). |
| `isFirst` | `boolean` | Whether this is the first item in sort order; disables the "move up" button. |
| `isLast` | `boolean` | Whether this is the last item in sort order; disables the "move down" button. |
| `disabled` | `boolean` | Whether admin controls are disabled (an update is in flight, per `ScheduleList`'s `isLoading`/debounce). |
| `canSetActive` | `boolean` | Whether the "set active" button should render for this item — true only for the item immediately before/after the currently active one, or the first item if none is active. |

### `ScheduleItem` internal state and handlers

| Name | Signature/Type | Behavior |
|---|---|---|
| `expanded` | `useState<boolean>`, initial `schedule.isActive` | Whether the item's body is shown. |
| `endTime` | `string` | `addMinutesToTime(schedule.startTimePlanned, schedule.durationPlanned)`, recomputed every render (not memoized). |
| `handleToggle` | `handleToggle(): void` | Toggles `expanded`, wrapped in a `LayoutAnimation.configureNext` for a smooth expand/collapse, and animates the chevron rotation to match. |

### `ScheduleList` internal functions

| Function | Signature | Behavior |
|---|---|---|
| `handleMoveUp` | `handleMoveUp(index: number): Promise<void>` | Swaps `sortIndex` between `sortedScheduleItems[index]` and its predecessor via two parallel `update` calls; sets `isLoading` for the duration plus a trailing `debounceTimeOut` (2s) after completion. |
| `handleMoveDown` | `handleMoveDown(index: number): Promise<void>` | Symmetric to `handleMoveUp`, swapping with the successor instead. |
| `handleSetActive` | `handleSetActive(storeIndex: number): Promise<void>` | Determines whether the currently active item's game has fully-signed/submitted results (see "Setting the active item" below); shows one or two confirmation dialogs accordingly; on confirm, marks the previously active item `isFinished`/inactive as appropriate and sets `sortedScheduleItems[storeIndex]` active, all via parallel `update` calls. |
| `handleDelete` | `handleDelete(storeIndex: number): Promise<void>` | Confirms (destructive) via `useDialog().confirm`, then deletes `sortedScheduleItems[storeIndex]` through `deleteItem`, toggling `isLoading` around the call. |
| `handleEdit` | `handleEdit(storeIndex: number): void` | Clones `sortedScheduleItems[storeIndex]` into `editingItem` and opens the item modal. |
| `addSchedule` | `addSchedule(): void` | Clears `editingItem` (add mode) and opens the item modal. |
| `handleModalSave` | `handleModalSave(data: ScheduleFormData): Promise<void>` | Passed as `onSave` to `ScheduleItemModal`. Updates `editingItem` merged with `data` if editing, otherwise calls `add(data)`; throws if the store call reports failure. |

### `ScheduleList` derived values

| Value | Type | Computed as |
|---|---|---|
| `sortedScheduleItems` | `Schedule[]` | `collection` copied and sorted ascending by `sortIndex`. Recomputed on `[collection]`. |
| `nextSortIndex` | `number` | `0` if there are no items, otherwise `max(sortIndex) + 1` — passed to `ScheduleItemModal` as the new item's default `sortIndex`. Recomputed on `[sortedScheduleItems]`. |
| `lastIndex` | `number` | `sortedScheduleItems.length - 1`, computed inline each render. |
| `activeIndex` | `number` | Index of the currently active item in `sortedScheduleItems` (`-1` if none), computed inline each render — feeds `canSetActive` for every row. |

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
into this component's own store calls. `onRules` opens
`/rules?gameId=...` through `goTo` with the schedule recorded as the origin
(so the rules screen's back button returns to the schedule rather than a
game hub the admin never opened) and closes the modal; `onLotteries` pushes
`/(pages)/(user)/lottery-add?gameId=...&from=/(pages)/(user)/schedule`
(URL-encoded) and closes the modal — the same screen tapping the "+"
button on [`lottery.tsx`](../../../app/(pages)/(user)/lottery.md)
navigates to, but with `from` set so that screen's back button returns
here instead of detouring through a lottery list this entry point never
visited (see [`lottery-add.tsx`'s "Why `from` exists"](../../../app/(pages)/(user)/lottery-add.md#why-from-exists)).
`ScheduleList` is also embedded in the admin dashboard's schedule tab
(`app/(pages)/(admin)/admin/index.tsx`), but this hardcoded `from` value
always points at the standalone `/schedule` route regardless of which
embedding the admin actually came from — a pre-existing simplification
also present in the "go to game" navigation a few lines up.

## Used by

- [`app/(pages)/(admin)/admin/index.tsx`](../../../app/(pages)/(admin)/admin/index.md)
- [`app/(pages)/(user)/schedule.tsx`](../../../app/(pages)/(user)/schedule.md)

## Related

- [`lib/stores/appwrite/schedule-store.ts`](../../stores/appwrite/schedule-store.md), [`result-store.ts`](../../stores/appwrite/result-store.md), [`table-store.ts`](../../stores/appwrite/table-store.md)
- [`lib/components/game/Table.tsx`](../game/Table.md) — rendered inside an expanded item with a game
