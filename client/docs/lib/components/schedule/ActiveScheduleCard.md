# `lib/components/schedule/ActiveScheduleCard.tsx`

[← lib/components/schedule](README.md)

## Purpose

Home-screen card for the currently active [`Schedule`](../../models/schedule.md)
item, with a "go to game" button if it has an associated game.

## Props

`{ item: Schedule }`

## How it works

Pressing "go to game" routes to `/game?gameId=...` if the current player
already has a team assigned, otherwise to
[`choose-your-character`](../../../app/(pages)/(team-player)/choose-your-character.md)
first (passing the `gameId` through as a param).

## Used by

- [`app/index.tsx`](../../../app/index.md)
