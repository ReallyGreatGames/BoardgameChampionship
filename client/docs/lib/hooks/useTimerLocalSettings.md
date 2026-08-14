# `lib/hooks/useTimerLocalSettings.ts`

[← lib/hooks](README.md)

## Purpose

Local, per-game, per-device timer display/interaction preferences that
never sync to the [`Timer`](../models/timer.md) document — orientation and
pause mode are a seating/device-setup decision, not shared tournament state.

## Exports

| Export | Type | Meaning |
|---|---|---|
| `TimerOrientationMode` | Type | `"center" \| "side"` |
| `TimerPauseMode` | Type | `"auto" \| "manual"` |
| `useTimerLocalSettings(gameId)` | Hook | See below |

### `useTimerLocalSettings(gameId: string | undefined)`

Returns `{ orientationMode, pauseMode, setOrientationMode, setPauseMode,
toggleOrientationMode, togglePauseMode }`.

## How it works

Backed by two independent
[`useSecureStoragePerGame`](useSecureStoragePerGame.md) instances (keys
`"timerOrientation"` and `"timerPauseMode"`) — the same pattern as the
player-color storage in [`useTimerState`](useTimerState.md). `toggle*`
helpers flip between the two possible values of each mode.

`pauseMode` (`"auto"` vs `"manual"`) directly controls the
single-active-seat behavior implemented in `useTimerState`'s `handlePress`
and the mode-switch effect there.

## Used by

- [`app/(pages)/(user)/timer.tsx`](../../app/(pages)/(user)/timer.md)
- [`lib/components/timer/TimerCell.tsx`](../components/timer/TimerCell.md)
- [`lib/components/timer/TimerControlPanel.tsx`](../components/timer/TimerControlPanel.md)
- [`lib/hooks/useTimerState.ts`](useTimerState.md) — consumes `pauseMode` as an input
