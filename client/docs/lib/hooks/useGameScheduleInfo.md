# `lib/hooks/useGameScheduleInfo.ts`

[← lib/hooks](README.md)

## Purpose

Answers "what is this game called, which round is it, and has it started
or finished?" for a single `gameId`. [`Game`](../models/game.md) itself
carries no name or ordering — both live on the
[`Schedule`](../models/schedule.md) item that plays it — so any screen
that shows a game by id needs this lookup.

## Exports

### `GameScheduleInfo`

| Property | Type | Meaning |
|---|---|---|
| `item` | `Schedule \| null` | The schedule item that plays this game, or `null` when the id is unknown/absent |
| `title` | `string` | The schedule item's title — the game's display name; `""` when there's no match |
| `round` | `number \| null` | 1-based position among the schedule's *game* items (non-game agenda items don't consume a round number), `null` when there's no match |
| `isActive` | `boolean` | `true` when this is the schedule item currently flagged `isActive` — i.e. the game is being played right now |
| `isFinished` | `boolean` | `true` when the schedule item is flagged `isFinished` |

### `useGameScheduleInfo(gameId: string | null | undefined): GameScheduleInfo`

Reads the schedule collection from
[`useScheduleStore`](../stores/appwrite/schedule-store.md) and returns the
entry above for `gameId`. Returns the empty info object (`null`/`""`/
`false`) for a missing id or an id no schedule item plays.

## How it works

Round numbering deliberately matches
[`useParticipantOverview`](useParticipantOverview.md): the collection is
sorted by `sortIndex`, then filtered down to items that have a `gameId`,
so breaks and briefings between games don't shift the round numbers a
player sees on the start page versus the game page.

The whole derivation sits in one `useMemo` keyed on
`[collection, gameId]`, so it recomputes once per realtime schedule update
rather than once per render.

## Used by

- [`app/(pages)/(user)/game.tsx`](../../app/(pages)/(user)/game.md) — header title/round, the state badge, and the active-game gating of the action buttons and table bell

## Related

- [`useParticipantOverview`](useParticipantOverview.md) — the same lookup across *every* game, from the current player's perspective
- [`usePlayerTable`](usePlayerTable.md) — the other half of the game page's context: which table the player sits at
