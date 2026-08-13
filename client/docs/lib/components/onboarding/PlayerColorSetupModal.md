# `lib/components/onboarding/PlayerColorSetupModal.tsx`

[← lib/components/onboarding](README.md)

## Purpose

Modal for assigning the 4 timer seats to specific players and colors,
laid out to mirror the physical timer grid.

## Props

`{ visible, onClose, players: Player[], onSave: (playerIds, colors) => Promise<void>, customColors?: string[] }`

## How it works

`GRID_ROWS = [[0,1],[3,2]]` deliberately mirrors the timer's own visual
grid layout (top row seats 0/1, bottom row seats 3/2) rather than a plain
sequential 0-1-2-3, so this setup screen's spatial layout matches what
players will actually see on the timer screen.

Tapping a seat's player name cycles to the next player in `players`
(`cyclePlayer`) rather than opening a picker — the small, always-4-slot UI
doesn't need a full selection modal. `hasDuplicatePlayers` disables saving
(with an explanatory message) if the same player got assigned to more than
one seat.

Colors default to [`PLAYER_COLORS`](../../utils/timerColors.md)'s swatches,
overridable per-slot via `customColors` (typically the game's own saved
colors).

## Used by

- [`app/(pages)/(user)/game.tsx`](../../../app/(pages)/(user)/game.md)
