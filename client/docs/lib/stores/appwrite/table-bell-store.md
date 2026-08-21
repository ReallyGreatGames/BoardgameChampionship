# `lib/stores/appwrite/table-bell-store.ts`

[← lib/stores/appwrite](README.md)

## Purpose

Zustand store for the `table-bell` collection
([`TableBell`](../../models/table-bell.md) — "table needs staff attention" events).

## Exports

### `useTableBellStore` (zustand hook)

| State/Method | Purpose |
|---|---|
| `collection: TableBell[]` | All `TableBell` documents — `{ table, startTime, acknowledgeTime?, locked?, reason? }` rows |
| `init(): Promise<void>` | `fetchCollection(key, set)` — loads the full `table-bell` collection with no query filter |
| `add(data: Omit<TableBell, keyof Models.Document>): Promise<TableBell \| null>` | Creates a `TableBell` via `addToCollection(key, data, { rowId: bellRowId(data.table), silentOnConflict: true })` — `data.table` (the table number) drives a deterministic id (see below); returns the created/existing document or `null` on a non-conflict failure |
| `update(item: PartialTableBell): Promise<boolean>` | `updateInCollection(key, item)` — partial update by `item.$id` (e.g. setting `acknowledgeTime` or `locked`); returns whether the update succeeded |
| `delete(data: PartialTableBell): Promise<boolean>` | `removeFromCollection(key, data)` — deletes the `TableBell` by `data.$id`; returns whether the delete succeeded |

### `type PartialTableBell`

`Partial<TableBell> & { $id: string }` — the shape `update`/`delete` expect.

## How it works

`add` uses [`bellRowId(table: number): string`](../../models/table-bell.md)
(returns `` `bell-${table}` ``) as a deterministic per-table document id with
`silentOnConflict: true` — only one active bell may exist per table, so two
simultaneous ring attempts (staff, or auto-ring racing across devices)
converge on one row instead of each creating their own; on a 409 conflict
`addToCollection` transparently fetches and returns the existing row instead
of erroring.

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
