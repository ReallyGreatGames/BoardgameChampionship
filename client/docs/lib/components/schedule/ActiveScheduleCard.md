# `lib/components/schedule/ActiveScheduleCard.tsx`

[← lib/components/schedule](README.md)

## Purpose

Home-screen card for the currently active [`Schedule`](../../models/schedule.md)
item, with a "go to game" button if it has an associated game.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `ActiveScheduleCard` (component) | `ActiveScheduleCard({ item: Schedule }): JSX` | Renders the home-screen card for the given schedule item: title, time range, and (if it has a game) a "go to game" button. |

### Props

| Prop | Type | Meaning |
|---|---|---|
| `item` | `Schedule` | The currently active schedule item to display. Its `startTimePlanned`/`durationPlanned` are used to compute the displayed end time; `gameId`, if set, determines whether the "go to game" button renders. |

## How it works

Pressing "go to game" routes to `/game?gameId=...` if the current player
already has a team assigned, otherwise to
[`choose-your-character`](../../../app/(pages)/(team-player)/choose-your-character.md)
first (passing the `gameId` through as a param). The displayed end time is
computed inline via `addMinutesToTime(item.startTimePlanned, item.durationPlanned)` —
not stored, always derived from the planned start/duration.

## Used by

- [`app/index.tsx`](../../../app/index.md)
