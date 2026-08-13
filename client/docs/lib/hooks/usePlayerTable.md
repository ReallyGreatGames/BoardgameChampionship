# `lib/hooks/usePlayerTable.ts`

[← lib/hooks](README.md)

## Purpose

Looks up which table number the currently signed-in player sits at for a
given game.

## Exports

### `usePlayerTable(gameId: string | null | undefined): number | null`

Reads the current player from [`usePlayer`](../bootstrap/PlayerProvider.md)
and the full table list from [`useTableStore`](../stores/appwrite/table-store.md),
and returns the `tableNumber` of the table (for that game) whose `players`
list includes the current player — or `null` if there's no `gameId`, no
current player, or no matching table.

Handles `t.game` being either a hydrated `Game` object or a bare relation
id string when comparing against `gameId`.

## Used by

- [`app/(pages)/(user)/game.tsx`](../../app/(pages)/(user)/game.md)
- [`app/(pages)/(user)/results.tsx`](../../app/(pages)/(user)/results.md)
- [`app/(pages)/(user)/signature.tsx`](../../app/(pages)/(user)/signature.md)
- [`app/(pages)/(user)/timer.tsx`](../../app/(pages)/(user)/timer.md)
