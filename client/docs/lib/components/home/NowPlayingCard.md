# `lib/components/home/NowPlayingCard.tsx`

[← lib/components/home](README.md)

## Purpose

The home screen's "now playing" card: which game the player is in, at
which table and round, who they're up against, how much of the round is
left, and a button into the game screen. The game-aware replacement for
[`ActiveScheduleCard`](../schedule/ActiveScheduleCard.md), which the home
screen still falls back to for non-game schedule items.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `NowPlayingCard` (component) | `NowPlayingCard({ match: ParticipantMatch }): JSX.Element` | Renders the running match as an accent-bordered card. |

### Props

| Prop | Type | Meaning |
|---|---|---|
| `match` | [`ParticipantMatch`](../../hooks/useParticipantOverview.md) | The running match: its schedule `item` (title + planned window), `gameId` (navigation target), `round`, `tableNumber`, and `opponents`. |

### Internal: `openMatch(): void`

Pushes to `/game?gameId=…&from=/` when the player already has a team and
id, otherwise to
[`choose-your-character`](../../../app/(pages)/(team-player)/choose-your-character.md)
with the `gameId` as a param — the same gate
[`ActiveScheduleCard`](../schedule/ActiveScheduleCard.md) applies, so a
player who hasn't picked a character yet is never dropped onto a game
screen that can't resolve their table.

### `makeStyles(colors: ReturnType<typeof useTheme>["colors"]): StyleSheet`

Builds the card, opponent-row, and countdown styles from theme colors;
memoized via `useMemo` on `colors`.

## How it works

The countdown comes from
[`useRoundCountdown`](../../hooks/useRoundCountdown.md) on the match's
schedule item, and drives three things at once: the `MM:SS` figure, the
caption below it ("left in this round" vs. "over the planned round time"),
and the [`Badge`](../ui/Badge.md) in the title row (`info`/"Live" flipping
to `danger`/"Overtime"). Rendering all three off one hook value is what
keeps them from ever disagreeing mid-tick.

The countdown row is built so nothing shifts while it ticks: the caption
is `textAlign: "right"` inside a `flex: 1` cell, so it stays pinned to the
card's right edge no matter how wide the figure gets, and the figure
itself uses `fontVariant: ["tabular-nums"]` so its digits keep a constant
advance width instead of the display font's proportional one.

`tableNumber` is `null` until an admin has seated the player, so the
table line degrades to a round-only label ("Round 3 · table to be
announced") rather than printing "Table null". Each opponent's country
chip is skipped when the team relation carries no country, and the label
falls back from team name to player name for the same reason.

## Used by

- [`app/index.tsx`](../../../app/index.md)

## Related

- [`lib/hooks/useParticipantOverview.ts`](../../hooks/useParticipantOverview.md)
- [`lib/components/ui/Button.tsx`](../ui/Button.md), [`Badge.tsx`](../ui/Badge.md)
