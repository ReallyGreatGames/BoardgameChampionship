# `lib/components/timer/TimerMenu.tsx`

[← lib/components/timer](README.md)

## Purpose

Overflow menu for the timer screen: reset, open the custom-timer modal,
revert to the game's default timer, or close the timer entirely. Also
hosts (renders) the [`CustomTimerModal`](CustomTimerModal.md) itself.

## Props

`{ open, onClose, onReset, onOpenCustomTimer, onUseDefaultTimer,
onCloseTimer, customTimerOpen, onCloseCustomTimer, initialDuration,
initialDirection, initialRoundSeconds, onSaveCustomTimer }`

## How it works

Renders as a full-screen backdrop + centered card, conditionally on `open`
(no animation library involvement — a plain conditional render). The
"close timer" menu item is styled in the error color to signal it's a
different kind of action from the others. `MenuButton` is a local,
unexported helper for the individual rows.

## Used by

- [`app/(pages)/(user)/timer.tsx`](../../../app/(pages)/(user)/timer.md)
