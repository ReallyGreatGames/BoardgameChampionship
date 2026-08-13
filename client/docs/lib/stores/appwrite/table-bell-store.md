# `lib/stores/appwrite/table-bell-store.ts`

[← lib/stores/appwrite](README.md)

## Purpose

Zustand store for the `table-bell` collection
([`TableBell`](../../models/table-bell.md) — "table needs staff attention" events).

## Exports

### `useTableBellStore` (zustand hook)

| State/Method | Purpose |
|---|---|
| `collection: TableBell[]` | All `TableBell` documents |
| `init()` | Loads the collection |
| `add(data)` | Creates a `TableBell` with a deterministic id (see below) |
| `update(item)` | Partial update by `$id` |
| `delete(data)` | Deletes a `TableBell` |

### `type PartialTableBell`

`Partial<TableBell> & { $id: string }` — the shape `update`/`delete` expect.

## How it works

`add` uses [`bellRowId(table)`](../../models/table-bell.md) as a
deterministic per-table document id with `silentOnConflict: true` — only
one active bell may exist per table, so two simultaneous ring attempts
(staff, or auto-ring racing across devices) converge on one row instead of
each creating their own.

## Used by

- [`lib/hooks/useTableBellActions.ts`](../../hooks/useTableBellActions.md)
- [`lib/hooks/useTimerState.ts`](../../hooks/useTimerState.md) — auto-rings on timeout
- [`lib/notifications/useTableBellNotifications.ts`](../../notifications/useTableBellNotifications.md)
- [`lib/components/results/ResultsAdminTab.tsx`](../../components/results/ResultsAdminTab.md)
- [`lib/components/shell/AppDrawer.tsx`](../../components/shell/AppDrawer.md)
- [`lib/bootstrap/RealTimeStoreProvider.tsx`](../../bootstrap/RealTimeStoreProvider.md)
- Screens: [`active-bells.tsx`](../../../app/(pages)/(admin)/active-bells.md), [`game.tsx`](../../../app/(pages)/(user)/game.md), [`timer.tsx`](../../../app/(pages)/(user)/timer.md)

## Related

- [`lib/models/table-bell.ts`](../../models/table-bell.md)
