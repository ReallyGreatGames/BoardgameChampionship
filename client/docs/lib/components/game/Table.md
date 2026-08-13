# `lib/components/game/Table.tsx`

[← lib/components/game](README.md)

## Purpose

Shows the table seating for a game — but only the one table the current
player is actually seated at; renders nothing if the player has no table
for this game.

## Props

`{ gameId: string }`

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
