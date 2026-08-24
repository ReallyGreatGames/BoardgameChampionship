# `lib/models/table-bell.ts`

[← lib/models](README.md)

## Purpose

Appwrite document type `TableBell` — a "table needs staff attention" event
(e.g. because a seat's timer ran out, or staff was called manually).

## Exports

### `type TableBell`

| Field | Type | Meaning |
|---|---|---|
| `table` | `number` | Table number |
| `startTime` | `string` | ISO timestamp of when the bell rang |
| `acknowledgeTime?` | `string` | ISO timestamp of staff acknowledgement |
| `locked?` | `boolean` | Set `true` when the bell was auto-rung by the timer running out (`useTimerState`); a locked bell can only be dismissed by an admin — `useTableBellActions.canDelete` returns `!locked \|\| isAdmin`, so regular staff can't dismiss it, only acknowledge it |
| `reason?` | `string` | Human-readable cause shown in the bell UI (e.g. the translated "timer elapsed" string set alongside `locked: true` in `useTimerState`); absent for manually-rung bells |

### `function bellRowId(table: number): string`

Deterministic document id (`bell-{table}`). Only one active bell may exist
per table; the stable id (instead of `ID.unique()`) means two simultaneous
ring attempts (two staff members, or two devices auto-ringing on the same
timeout) collide at the database layer instead of each creating its own
row — see [table-bell-store.ts](../stores/appwrite/table-bell-store.md).

## Used by

- [`app/(pages)/(admin)/active-bells.tsx`](../../app/(pages)/(admin)/active-bells.md)
- [`lib/components/results/ResultsAdminTab.tsx`](../components/results/ResultsAdminTab.md)
- [`lib/components/results/types.ts`](../components/results/types.md)
- [`lib/components/timer/TimerControlPanel.tsx`](../components/timer/TimerControlPanel.md)
- [`lib/hooks/useTableBellActions.ts`](../hooks/useTableBellActions.md)
- [`lib/hooks/useTimerState.ts`](../hooks/useTimerState.md)
- [`lib/stores/appwrite/table-bell-store.ts`](../stores/appwrite/table-bell-store.md)
