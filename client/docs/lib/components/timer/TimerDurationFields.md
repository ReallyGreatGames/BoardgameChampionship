# `lib/components/timer/TimerDurationFields.tsx`

[← lib/components/timer](README.md)

## Purpose

Shared duration/round-time/direction form fields (JSX only — see
[`useDurationRoundFields`](../../hooks/useDurationRoundFields.md) for the
paired state/validation hook), used by both the per-table custom timer
override ([`CustomTimerModal`](CustomTimerModal.md)) and the per-game
default timer settings
([`TimerSettingsModal`](../schedule/TimerSettingsModal.md)) so the two
forms can't visually drift apart.

## Props

`{ duration, onDurationChange, onDurationBlur?, durationLabel,
durationPlaceholder, durationInvalid, roundSeconds,
onRoundSecondsChange, roundSecondsLabel, roundSecondsPlaceholder,
roundSecondsInvalid, direction, onDirectionChange, directionLabel,
directionDownLabel, directionUpLabel }`

## Used by

- [`lib/components/schedule/TimerSettingsModal.tsx`](../schedule/TimerSettingsModal.md)
- [`lib/components/timer/CustomTimerModal.tsx`](CustomTimerModal.md)
