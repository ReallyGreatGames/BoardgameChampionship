# `lib/hooks/useParticipantOverview.ts`

[← lib/hooks](README.md)

## Purpose

Cross-store lookup that answers "how is *this* player doing in the
tournament?" in one object: which match they're in right now (with table
and opponents), every game of the tournament with their placement/points,
and their running total. It's the entire data layer of the participant
start page ([`app/index.tsx`](../../app/index.md)).

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `ParticipantGameState` | Type | `"played" \| "playing" \| "upcoming"` |
| `ParticipantOpponent` | Type | One other player at the current player's table |
| `ParticipantGameEntry` | Type | One game of the tournament from this player's perspective |
| `ParticipantMatch` | Type | The currently running match, if the active schedule item is a game |
| `ParticipantOverview` | Type | The hook's return value |
| `useParticipantOverview()` | `() => ParticipantOverview` | Derives all of the above from the player, schedule, table, and result stores |

`ParticipantOpponent` properties:

| Property | Type | Meaning |
|---|---|---|
| `id` | `string` | The opponent's player document id (list key) |
| `name` | `string` | The opponent's display name — the fallback label when they have no team |
| `teamName` | `string` | Their team's display name, or `""` if the relation isn't hydrated |
| `country` | `string` | Their team's ISO-3166 alpha-2 country code, or `""` — rendered as the small country chip |

`ParticipantGameEntry` properties:

| Property | Type | Meaning |
|---|---|---|
| `scheduleId` | `string` | Document id of the schedule item this game is played in (list key) |
| `gameId` | `string` | Id of the [`Game`](../models/game.md) played |
| `title` | `string` | The schedule item's title — the game's display name, since [`Game`](../models/game.md) itself carries no name |
| `round` | `number` | 1-based position among the schedule's *game* items (non-game agenda items don't consume a round number) |
| `tableNumber` | `number \| null` | The table this player sits at for this game, or `null` if no table has been assigned to them yet |
| `placement` | `number \| null` | Their finishing place (1-4) from the submitted result, or `null` while there is none |
| `points` | `number \| null` | Tournament points earned (5-3-2-1, averaged on ties — see [`computeTablePoints`](../utils/placements.md)), or `null` while there is no submitted result |
| `state` | `ParticipantGameState` | `"playing"` for the active schedule item, `"played"` once there's a result or the item is finished, `"upcoming"` otherwise |

`ParticipantMatch` properties:

| Property | Type | Meaning |
|---|---|---|
| `item` | [`Schedule`](../models/schedule.md) | The active schedule item, used for its title and its planned start/duration (the round countdown) |
| `gameId` | `string` | Id of the game being played |
| `round` | `number` | Round number of this match, same numbering as `ParticipantGameEntry.round` |
| `tableNumber` | `number \| null` | The player's table for this match, `null` when not yet assigned |
| `opponents` | `ParticipantOpponent[]` | The other players at that table, in seat order, excluding the current player |

`ParticipantOverview` properties:

| Property | Type | Meaning |
|---|---|---|
| `activeItem` | `Schedule \| null` | The schedule item flagged `isActive`, whether or not it's a game (so the caller can fall back to [`ActiveScheduleCard`](../components/schedule/ActiveScheduleCard.md) for breaks/briefings) |
| `currentMatch` | `ParticipantMatch \| null` | Non-`null` only when the active item is a game item, i.e. when there is a match to show |
| `entries` | `ParticipantGameEntry[]` | Every game item of the schedule, in schedule order — the player's whole tournament, past and future |
| `totalPoints` | `number` | Sum of every non-`null` `points` in `entries` |
| `playedCount` | `number` | Number of entries in state `"played"` (the currently running one is deliberately not counted as played) |
| `totalCount` | `number` | `entries.length` — the tournament's total game count |

### `useParticipantOverview(): ParticipantOverview`

No parameters. Reads the current player from
[`usePlayer`](../bootstrap/PlayerProvider.md) and the schedule, table, and
result collections from their stores; returns an empty overview
(`totalCount: 0`, everything `null`/`0`) while no player is selected.

## How it works

Everything is derived in a single `useMemo` keyed on
`[player, scheduleCollection, tableCollection, resultCollection]`, so the
whole overview is recomputed exactly once per relevant realtime update
rather than once per consuming component.

### Locating the player's table and seat

`findPlayerTable` matches a table by both `resolveGameId(table.game) === gameId`
(the relation may arrive hydrated or as a bare id string — see
[`resolveGameId`](../utils.md)) and the player appearing in `table.players`.
The player's index in that array *is* their seat index, which is what
indexes [`Result`](../models/result.md)'s `placements`/`scores` arrays.

### When a game counts as played

Placement and points are only read from **submitted** results — an
in-progress or saved-but-unsubmitted result contributes no points, since
those numbers aren't final until the table has signed off. A game still
counts as `"played"` (with `points: null`) when its schedule item is
already `isFinished` but no submitted result exists yet, so a missing
result shows up as a gap rather than silently reappearing as "upcoming".
The currently active item always wins the state race and is reported as
`"playing"`, which is also why it's excluded from `playedCount` — "after 2
of 4 games" should not count the game being played right now.

## Used by

- [`app/index.tsx`](../../app/index.md)

## Related

- [`lib/utils/placements.ts`](../utils/placements.md)
- [`lib/hooks/usePlayerTable.ts`](usePlayerTable.md) — the same table lookup, but returning only the table number for one game
- [`lib/components/home/`](../components/home/README.md) — the components that render this
