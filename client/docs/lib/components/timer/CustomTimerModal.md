# `lib/components/timer/CustomTimerModal.tsx`

[← lib/components/timer](README.md)

## Purpose

Modal for setting a per-table timer override (duration/round-time/direction),
distinct from the game's default settings.

## Props

`{ visible, onClose, initialDuration?, initialDirection?,
initialRoundSeconds?, onSave: (duration, direction, roundSeconds) => Promise<void> }`

## How it works

Built on [`useDurationRoundFields`](../../hooks/useDurationRoundFields.md)
for field state/validation, and
[`TimerDurationFields`](TimerDurationFields.md) for the shared JSX.

`initialDuration` is converted from the stored total-minutes value to
per-player minutes for display (`Math.round(initialDuration / 4)`) when the
modal opens, and `handleSave` converts back (`durNum * 4`) before calling
`onSave` — the form always works in per-player minutes, matching what's shown.

## Used by

- [`lib/components/timer/TimerMenu.tsx`](TimerMenu.md)
