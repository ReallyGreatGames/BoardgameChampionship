# `lib/components/schedule/useOpenGame.ts`

[← lib/components/schedule](README.md)

## Purpose

The "go to game" navigation shared by [`RunningNowCard`](RunningNowCard.md)
and [`ScheduleRow`](ScheduleRow.md), so the two don't each carry a copy of
the same branch.

## Exports

### `useOpenGame(): (gameId: string) => void`

Returns a `useCallback`-stable opener. A player who already has both a
team and a player record goes straight to `/game?gameId=…`, routed through
[`goTo`](../../utils/navigation.md) with `/(pages)/(user)/schedule` as the
origin so the game screen's back button returns to the schedule rather
than to a game hub this entry point never opened. Anyone else is pushed to
`/(pages)/(team-player)/choose-your-character` with the `gameId` as a
param, to pick a character first.

The origin is hardcoded to the standalone `/schedule` route even when the
list is embedded in the admin dashboard's schedule tab — a simplification
carried over from the previous inline copies of this logic.

## Used by

- [`RunningNowCard.tsx`](RunningNowCard.md)
- [`ScheduleRow.tsx`](ScheduleRow.md)
