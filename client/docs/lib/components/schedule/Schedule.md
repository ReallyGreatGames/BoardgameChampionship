# `lib/components/schedule/Schedule.tsx`

[← lib/components/schedule](README.md)

## Purpose

The full tournament schedule, grouped into the running item, "up next"
and a collapsible "done" section, with (for admins) inline reordering,
activation, editing and deletion. Holds all of the feature's store logic;
the three visual pieces live in
[`RunningNowCard`](RunningNowCard.md), [`ScheduleRow`](ScheduleRow.md) and
[`ScheduleHeader`](ScheduleHeader.md).

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `ScheduleList` (component) | `ScheduleList(): JSX` | No props — reads the schedule/result/table stores itself. Renders the grouped list, the two modals (item edit, timer settings), and (for admins) the "add item" button. The component actually mounted by screens. |

## Layout

```
RunningNowCard          the item with isActive (omitted when none)
"Als nächstes"          every item that is neither active nor finished
  … ScheduleRow(upcoming)
  … "add item"          admins only
"Erledigt · N"          collapsible; every finished, non-active item
  … ScheduleRow(done)
```

`ScheduleList` supplies no horizontal padding — that is the embedding
screen's job, because [`schedule.tsx`](../../../app/(pages)/(user)/schedule.md)
and the admin dashboard's schedule tab use different gutters.

## `ScheduleList` internal functions

| Function | Signature | Behavior |
|---|---|---|
| `handleMoveUp` | `handleMoveUp(index: number): Promise<void>` | Swaps `sortIndex` between `sortedScheduleItems[index]` and its predecessor via two parallel `update` calls; sets `isLoading` for the duration plus a trailing `debounceTimeOut` (2s) after completion. |
| `handleMoveDown` | `handleMoveDown(index: number): Promise<void>` | Symmetric to `handleMoveUp`, swapping with the successor instead. |
| `confirmActiveChange` | `confirmActiveChange(): Promise<boolean>` | The one or two confirmation dialogs every activation goes through (see "Setting the active item" below). Returns whether the admin confirmed all of them. |
| `handleSetActive` | `handleSetActive(storeIndex: number): Promise<void>` | Confirms, then marks the previously active item `isFinished`/inactive as appropriate and sets `sortedScheduleItems[storeIndex]` active, all via parallel `update` calls. Backs "start" and "start next". |
| `handleRestart` | `handleRestart(storeIndex: number): Promise<void>` | Confirms, then makes `sortedScheduleItems[storeIndex]` the running item and clears `isFinished` on it *and everything after it*, moving the rest of the day back to "up next". Items before it stay done. Backs "restart". |
| `handleDelete` | `handleDelete(storeIndex: number): Promise<void>` | Confirms (destructive) via `useDialog().confirm`, then deletes `sortedScheduleItems[storeIndex]` through `deleteItem`, toggling `isLoading` around the call. |
| `handleEdit` | `handleEdit(storeIndex: number): void` | Clones `sortedScheduleItems[storeIndex]` into `editingItem` and opens the item modal. |
| `addSchedule` | `addSchedule(): void` | Clears `editingItem` (add mode) and opens the item modal. |
| `handleModalSave` | `handleModalSave(data: ScheduleFormData): Promise<void>` | Passed as `onSave` to `ScheduleItemModal`. Updates `editingItem` merged with `data` if editing, otherwise calls `add(data)`; throws if the store call reports failure. |
| `canSetActive` | `canSetActive(index: number): boolean` | Whether an *upcoming* item may be started: only the item directly before or after the active one, or the first item when nothing is active. Finished items ignore it. |
| `adminActions` | `adminActions(index, variant): ScheduleRowAdmin` | Builds one row's admin prop bundle. Passes the move callbacks only for `"upcoming"`; `onSetActive` is `handleRestart` for every `"done"` row and `handleSetActive` for an `"upcoming"` row that passes `canSetActive(index)`. |
| `toggleDone` | `toggleDone(): void` | Collapses/expands the done section behind a `LayoutAnimation`. |

## `ScheduleList` derived values

| Value | Type | Computed as |
|---|---|---|
| `sortedScheduleItems` | `Schedule[]` | `collection` copied and sorted ascending by `sortIndex`. Recomputed on `[collection]`. |
| `nextSortIndex` | `number` | `0` if there are no items, otherwise `max(sortIndex) + 1` — passed to `ScheduleItemModal` as the new item's default `sortIndex`. |
| `lastIndex` | `number` | `sortedScheduleItems.length - 1`. |
| `activeIndex` / `activeItem` | `number` / `Schedule \| null` | The item with `isActive`, or `-1`/`null`. |
| `upcoming` / `done` | `{ item: Schedule; index: number }[]` | The two groups, split in one pass over `sortedScheduleItems`. |

### Why the groups carry an `index`

Every admin handler addresses items by their position in
`sortedScheduleItems` — `handleMoveUp(index)` looks up `index - 1`,
`handleSetActive(index)` compares against `activeIndex`. Grouping the
items would otherwise renumber them, so each entry keeps its original
index alongside the item and the group only decides where it renders.

## How it works

### Admin reordering (`handleMoveUp`/`handleMoveDown`)

Swaps `sortIndex` between the item and its neighbor via two parallel
`update` calls. A 2-second `debounceTimeOut` disables all admin buttons
after any such update: [`real-time-store.ts`](../../stores/real-time-store.md)'s
event dedup logic can cause a same-document update fired again within a
few seconds of a prior one to be silently dropped, which would otherwise
leave `sortIndex` out of sync with the actually-applied order if an admin
clicked the reorder buttons rapidly.

Note that the neighbor a move swaps with is the neighbor in the full
sorted list, which — if the active item sits between two upcoming ones —
is not necessarily the row rendered above or below it. The buttons only
appear in the "up next" group, where that case is rare enough that the
list order is the honest thing to move by.

### Setting the active item (`confirmActiveChange`/`handleSetActive`)

Before activating a different item, `confirmActiveChange` checks whether the *currently* active
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

### Restarting a finished item (`handleRestart`)

Every row in the done group offers "restart", not just the one directly
before the active item — an admin who has to rewind the day shouldn't have
to walk it back one entry at a time. Restarting item *i* makes it the
running one and clears `isFinished` from *i* onwards, so every item after
it — including the one that was running — lands back in "up next" in its
existing order. Items before *i* keep their `isFinished` and stay in the
done group. It runs behind the same `confirmActiveChange` prompts as a
normal activation, which is where the already-signed-results warning
lives.

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
also present in [`useOpenGame`](useOpenGame.md).

## Used by

- [`app/(pages)/(admin)/admin/index.tsx`](../../../app/(pages)/(admin)/admin/index.md)
- [`app/(pages)/(user)/schedule.tsx`](../../../app/(pages)/(user)/schedule.md)

## Related

- [`lib/stores/appwrite/schedule-store.ts`](../../stores/appwrite/schedule-store.md), [`result-store.ts`](../../stores/appwrite/result-store.md), [`table-store.ts`](../../stores/appwrite/table-store.md)
- [`RunningNowCard.tsx`](RunningNowCard.md), [`ScheduleRow.tsx`](ScheduleRow.md) — the two row renderers
