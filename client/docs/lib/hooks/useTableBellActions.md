# `lib/hooks/useTableBellActions.ts`

[← lib/hooks](README.md)

## Purpose

Ring/dismiss/acknowledge actions for table bells, on top of
[`useTableBellStore`](../stores/appwrite/table-bell-store.md).

## Exports

### `useTableBellActions()`

Takes no parameters. Wires together [`useAuth`](../auth.md) (for `isAdmin`),
[`useTableBellStore`](../stores/appwrite/table-bell-store.md) (for the
create/update/delete calls), and [`useDialog`](../components/ui/Dialog.md)
(for optional confirmation prompts), plus a local `loadingId` state used to
track which single bell is mid-mutation. Returns an object with:

| Property | Signature | Meaning |
|---|---|---|
| `canDelete` | `(bell: TableBell) => boolean` | `true` if `bell` can be dismissed by the current user: unlocked bells can always be dismissed, locked bells only by an admin (`!bell.locked \|\| isAdmin`). |
| `ring` | `(table: number, opts?: { locked?: boolean; reason?: string }, confirmOpts?: DialogOptions) => Promise<boolean>` | Creates a new bell for `table` with `startTime` set to now, plus any `locked`/`reason` passed in `opts`. If `confirmOpts` is given, shows a confirm dialog first and bails out (returning `false`) if the user declines; otherwise creates the bell and returns `true`. |
| `dismiss` | `(bell: TableBell, confirmOpts?: DialogOptions) => Promise<boolean>` | Deletes `bell`. Returns `false` immediately (no dialog, no delete) if `canDelete(bell)` is `false`. Otherwise optionally confirms, then deletes, setting `loadingId` to `bell.$id` for the duration so `isLoadingBell` reflects it, and clearing it in a `finally` even if the delete throws. |
| `acknowledge` | `(bell: TableBell, confirmOpts?: DialogOptions) => Promise<boolean>` | Sets `bell.acknowledgeTime` to now via a store update. Optionally confirms first; tracks `loadingId` the same way as `dismiss`. |
| `isLoading` | `boolean` | `true` whenever any bell has an in-flight `dismiss`/`acknowledge` call (`loadingId !== null`). |
| `isLoadingBell` | `(bell: TableBell) => boolean` | `true` only if `bell` is the specific bell currently loading (`loadingId === bell.$id`), for per-row spinners in a list of bells. |

Every action that takes `confirmOpts` follows the same pattern: if
`confirmOpts` is omitted the action runs immediately; if provided, `confirm`
(from `useDialog`) is awaited first and the action is skipped (returning
`false`) if the user dismisses/cancels the dialog.

## Used by

- [`app/(pages)/(admin)/active-bells.tsx`](../../app/(pages)/(admin)/active-bells.md)
- [`app/(pages)/(user)/game.tsx`](../../app/(pages)/(user)/game.md)
- [`app/(pages)/(user)/timer.tsx`](../../app/(pages)/(user)/timer.md)
- [`lib/components/results/ResultsAdminTab.tsx`](../components/results/ResultsAdminTab.md)
