# `lib/components/home/PlayerGameList.tsx`

[← lib/components/home](README.md)

## Purpose

The per-game breakdown under
[`PlayerScoreSummary`](PlayerScoreSummary.md): one divider-separated row
per game of the tournament, showing round, table, finishing place, and
points earned — or a muted placeholder for games not played yet.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `PlayerGameList` (component) | `PlayerGameList({ entries: ParticipantGameEntry[] }): JSX.Element` | Renders the list of games, in schedule order. |

### Props

| Prop | Type | Meaning |
|---|---|---|
| `entries` | [`ParticipantGameEntry[]`](../../hooks/useParticipantOverview.md) | Every game of the tournament from this player's perspective, already in schedule order — one row each, keyed by `scheduleId`. |

### Internal: `metaFor(entry: ParticipantGameEntry): string`

Builds a row's subtitle by joining the parts that exist with `·`: the
round, then either the table number or "table to be announced", then —
only once a submitted result gives the player a place — the placement
label (`placements.1`…`placements.4`, e.g. "1st place"). Placement is
looked up as a fixed key per place rather than formatted from a number,
since a table has exactly four seats and English/German ordinals don't
share a rule.

### `makeStyles(colors: ReturnType<typeof useTheme>["colors"]): StyleSheet`

Builds the row, divider, and typography styles from theme colors;
memoized via `useMemo` on `colors`.

## How it works

Rows in state `upcoming` are drawn in muted/placeholder text colors so the
list reads as "here's what you've done" with the future greyed out behind
it, instead of giving equal weight to games that haven't happened.

The trailing cell shows points when there are any, and otherwise falls
back to "playing now" for the running game or "not played" — a game can be
finished and still have no points (no submitted result yet), which is why
the fallback keys off `points === null`, not off the row's state.

The divider is applied per row (`index < entries.length - 1`) instead of
as a bottom border on all of them, so the section doesn't end in a
dangling rule.

## Used by

- [`app/index.tsx`](../../../app/index.md)

## Related

- [`lib/utils/placements.ts`](../../utils/placements.md) — where the 5-3-2-1 points come from
