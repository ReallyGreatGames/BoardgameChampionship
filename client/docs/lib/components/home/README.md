# `lib/components/home`

[← lib/components](../README.md)

The participant start page ([`app/index.tsx`](../../../app/index.md)):
a branded hero, the match that's running right now, and the player's own
running score. Every component here is presentational — all of the data
they render comes from
[`useParticipantOverview`](../../hooks/useParticipantOverview.md).

The two older home-screen widgets, [`ActiveScheduleCard`](../schedule/ActiveScheduleCard.md)
and [`UpcomingList`](../schedule/UpcomingList.md), still live under
[`schedule/`](../schedule/README.md) and are used as the fallback when the
active schedule item isn't a game (a break, a briefing) or when nothing is
running at all.

## Files

| File | Purpose |
|---|---|
| [NowPlayingCard.md](NowPlayingCard.md) | The running match: game, table, opponents, round countdown, "open match" |
| [ParticipantHero.md](ParticipantHero.md) | Branded header: menu button, tournament logo, greeting, team |
| [PlayerGameList.md](PlayerGameList.md) | One row per game of the tournament with placement and points |
| [PlayerScoreSummary.md](PlayerScoreSummary.md) | Total points, games played, and a per-game progress bar |
