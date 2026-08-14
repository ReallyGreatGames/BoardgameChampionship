# `lib/hooks/useTableBellActions.ts`

[← lib/hooks](README.md)

## Purpose

Ring/dismiss/acknowledge actions for table bells, on top of
[`useTableBellStore`](../stores/appwrite/table-bell-store.md).

## Exports

### `useTableBellActions()`

Returns `{ canDelete(bell), ring(table, opts?, confirmOpts?),
dismiss(bell, confirmOpts?), acknowledge(bell, confirmOpts?), isLoading,
isLoadingBell(bell) }`.

## How it works

- `canDelete(bell)` — a locked bell can only be dismissed by an admin
  (`!bell.locked || isAdmin`).
- `ring(table, opts?, confirmOpts?)` — optionally shows a confirmation
  dialog first, then creates a bell (`startTime: now`, plus any `locked`/
  `reason` passed in `opts`).
- `dismiss(bell, confirmOpts?)` — refuses if `!canDelete(bell)`; otherwise
  optionally confirms, then deletes the bell, tracking `loadingId` for a
  per-bell loading state.
- `acknowledge(bell, confirmOpts?)` — optionally confirms, then sets
  `acknowledgeTime` to now.

## Used by

- [`app/(pages)/(admin)/active-bells.tsx`](../../app/(pages)/(admin)/active-bells.md)
- [`app/(pages)/(user)/game.tsx`](../../app/(pages)/(user)/game.md)
- [`app/(pages)/(user)/timer.tsx`](../../app/(pages)/(user)/timer.md)
- [`lib/components/results/ResultsAdminTab.tsx`](../components/results/ResultsAdminTab.md)
