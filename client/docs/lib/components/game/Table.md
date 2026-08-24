# `lib/components/game/Table.tsx`

[← lib/components/game](README.md)

## Purpose

Shows the table seating for a game — but only the one table the current
player is actually seated at; renders nothing if the player has no table
for this game.

## Exports

### `Table({ gameId }: { gameId: string }): JSX.Element | null`

| Prop | Type | Meaning |
|---|---|---|
| `gameId` | `string` | The `$id` of the game whose table the current player should be shown for. |

Renders the seating card for the current player's table in this game, or `null` if the player isn't seated at any table for it. Not exported as a named type — the prop object is inlined in the function signature.

## How it works

Finds the table via [`useTableStore`](../../stores/appwrite/table-store.md)
where `game.$id === gameId` (handling `t.game` as either a hydrated object
or bare id string) **and** the current player
([`usePlayer`](../../bootstrap/PlayerProvider.md)) is in that table's
`players`. Renders `null` if no such table exists — this is a "your table"
widget, not a general table browser.

## Used by

- [`app/(pages)/(user)/game.tsx`](../../../app/(pages)/(user)/game.md)
- [`lib/components/schedule/Schedule.tsx`](../schedule/Schedule.md) — inside an expanded schedule item
