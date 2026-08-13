# `lib/components/timer/TimerControlPanel.tsx`

[← lib/components/timer](README.md)

## Purpose

Floating control panel overlaid on the timer screen: table-elapsed-time
readout, a row of icon toggles (orientation, overflow menu, pause mode),
and two full-width action bars (table bell, pause/resume all). Replaces an
older, smaller round menu-trigger button.

## Props

`{ onOpenMenu, orientationMode, onToggleOrientation, pauseMode,
onTogglePauseMode, bell, bellElapsedLabel, onToggleBell, bellLoading?,
bellDisabled?, allPaused, onToggleAllPause, tableElapsedLabel,
spamProtectionActive }`

## How it works

The table-elapsed-time row is deliberately small and non-interactive — see
[`useTimerState`](../../hooks/useTimerState.md)'s `tableElapsedSeconds` doc
comment: it's useful context, not a focal element.

When `spamProtectionActive` is true (see
[`useTimerState`](../../hooks/useTimerState.md)'s `registerPressAndCheckSpam`
doc — too many seat/pause-all presses in a short window), a banner appears
between the table-elapsed row and the icon row, and the pause/resume-all
bar is disabled. Per-seat cells aren't disabled here — `handlePress` itself
already no-ops while protection is active, and the banner is the single,
centrally-visible indicator rather than restyling all four
[`TimerCell`](TimerCell.md)s.

The bell action bar's color/label depend on
[`TableBell`](../../models/table-bell.md) state: gray/"ring bell" if no
bell exists, accent-colored/"ringing" if one exists unacknowledged,
success-colored/"acknowledged" if it's been acknowledged.

Internal helper components `IconToggle` (small square icon buttons) and
`PanelBar` (full-width icon+label+optional-trailing-label bars, with a
loading/disabled state) aren't exported — local to this file only.

## Used by

- [`app/(pages)/(user)/timer.tsx`](../../../app/(pages)/(user)/timer.md)
