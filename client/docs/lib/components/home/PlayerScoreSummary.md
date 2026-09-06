# `lib/components/home/PlayerScoreSummary.tsx`

[← lib/components/home](README.md)

## Purpose

The headline of the home screen's "my results so far" section: the
player's total tournament points, how far into the tournament they are,
and a segmented bar giving the whole tournament at a glance — one segment
per game, colored by whether it's done, running, or still ahead.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `PlayerScoreSummary` (component) | `PlayerScoreSummary(props): JSX.Element` | Renders the points card with its progress bar and per-game caption. |

### Props

| Prop | Type | Meaning |
|---|---|---|
| `entries` | [`ParticipantGameEntry[]`](../../hooks/useParticipantOverview.md) | Every game of the tournament from this player's perspective; drives one bar segment and one caption part each. |
| `totalPoints` | `number` | Points earned so far — the big figure. |
| `playedCount` | `number` | Games finished, excluding the one currently being played. |
| `totalCount` | `number` | Total number of games in the tournament. |

### Internal: `segmentColor(entry: ParticipantGameEntry): string`

Maps a game's state to its bar color: `accent` for the game being played
right now (the one moment worth the loudest color on the screen),
`primary` for a finished game, `divider` for one still to come.

### Internal: `caption` (`useMemo`, deps `[entries, t]`)

Builds the line under the bar by mapping each entry to its points (via
[`formatPoints`](../../utils.md)), "playing now", "no result", or "to
come", then joining with `·`. Consecutive "to come" parts are collapsed to
a single one, so a tournament with six games still to play reads
"5 · 2 · playing now · to come" rather than repeating the same word four
times.

### `makeStyles(colors: ReturnType<typeof useTheme>["colors"]): StyleSheet`

Builds the card, headline, and bar styles from theme colors; memoized via
`useMemo` on `colors`.

## How it works

Points can be fractional — [`computeTablePoints`](../../utils/placements.md)
averages the 5-3-2-1 scale across tied places — so every figure goes
through [`formatPoints`](../../utils.md) rather than being interpolated
directly, keeping "7" from rendering as "7" in one place and "7.0" in
another.

## Used by

- [`app/index.tsx`](../../../app/index.md)

## Related

- [`lib/components/home/PlayerGameList.tsx`](PlayerGameList.md) — the per-game breakdown rendered directly below this
