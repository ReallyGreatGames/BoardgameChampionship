# `lib/components/schedule/TimerSettingsModal.tsx`

[← lib/components/schedule](README.md)

## Purpose

Add/edit modal for a game's default timer settings
([`Game`](../../models/game.md) — duration, round-time, direction, and the
4 player colors), reached from a schedule item's "timer" action.

## Props

`{ visible, gameId: string | null, onClose, onCreated?: (newGameId: string) => void }`

## How it works

Looks up `gameId` in [`useTimerSettingsStore`](../../stores/appwrite/timer-settings-store.md)'s
collection (`existing`); if found, pre-fills the form (via
[`useDurationRoundFields`](../../hooks/useDurationRoundFields.md)'s
`reset`, converting stored total-duration back to per-player minutes) and
`playerColors` from `existing.colors` (falling back to
[`PLAYER_COLORS`](../../utils/timerColors.md)'s defaults if fewer than 4
are stored). If no `gameId` or no matching document, starts blank.

On save, either `update`s the existing `Game` document or `add`s a new
one — for a new one, `onCreated(newId)` lets the caller
([`Schedule.tsx`](Schedule.md)) attach the freshly-created game id back
onto the schedule item being edited.

Each of the 4 player colors is edited via a collapsible row containing a
`reanimated-color-picker` panel + hue slider — only one player's picker can
be expanded at a time (`expandedPlayer`).

## Used by

- [`lib/components/schedule/Schedule.tsx`](Schedule.md)
