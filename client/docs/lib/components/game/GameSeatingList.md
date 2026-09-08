# `lib/components/game/GameSeatingList.tsx`

[← lib/components/game](README.md)

## Purpose

The "Teilnehmer" card on the game page: one row per player at the table,
showing seat number, name, country chip and team, with the current
player's row highlighted. The richer sibling of
[`Table`](Table.md) — that one is the compact variant still used inside an
expanded schedule item.

## Exports

### `GameSeatingList({ table }: Props): JSX.Element | null`

| Prop | Type | Meaning |
|---|---|---|
| `table` | [`Table`](../../models/table.md) `\| null \| undefined` | The table document to render seating for. Renders `null` when absent, so the caller can pass a lookup result straight through. |

Rows are rendered in `table.players` order — that array's index *is* the
seat number (`index + 1`), the same convention
[`useParticipantOverview`](../../hooks/useParticipantOverview.md) and the
timer's seat mapping use.

### Internal: `teamOf(player: Player): { name: string; country: string }`

Reads `player.team` defensively: an unhydrated relation comes back from
Appwrite as a bare id string rather than a [`Team`](../../models/team.md)
object, in which case both fields are `""` and the country chip/team line
simply don't render.

## How it works

The current player is read from [`usePlayer`](../../bootstrap/PlayerProvider.md)
rather than passed in, since every consumer would otherwise have to thread
it through. Their row gets `colors.surface` instead of the card's
`colors.background`, and their seat tile inverts to `colors.primary`/
`colors.onAccent` — the design's way of letting a player find themselves
in the list at a glance.

Row separators are drawn with `borderTopWidth` on every row *except* the
first, so the card's own border isn't doubled at the top edge.

## Used by

- [`app/(pages)/(user)/game.tsx`](../../../app/(pages)/(user)/game.md)

## Related

- [`Table.tsx`](Table.md) — the compact seating variant used by the [schedule](../schedule/README.md)
- [`lib/models/table.ts`](../../models/table.md), [`player.ts`](../../models/player.md), [`team.ts`](../../models/team.md)
