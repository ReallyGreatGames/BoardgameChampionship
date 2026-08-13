# `app/(pages)/(user)/timer.tsx`

[← app](../../README.md)

## Route

`/timer?gameId=...`

## Purpose

The interactive timer screen itself — assembles
[`TimerCell`](../../../lib/components/timer/TimerCell.md) ×4,
[`TimerControlPanel`](../../../lib/components/timer/TimerControlPanel.md),
and [`TimerMenu`](../../../lib/components/timer/TimerMenu.md) around the
state and actions from
[`useTimerState`](../../../lib/hooks/useTimerState.md), which owns
essentially all of the actual logic.

## How it works

### Orientation + keep-awake

`useFocusEffect` forces landscape-right orientation and activates
`expo-keep-awake` while this screen has focus, reverting both on blur —
the timer is meant to sit flat on a table for the whole game, so the
device shouldn't rotate away or sleep mid-round.

### Seat layout

`seatOrder = [[0,1],[3,2]]` mirrors
[`PlayerColorSetupModal`](../../../lib/components/onboarding/PlayerColorSetupModal.md)'s
own grid layout — the same physical corner arrangement is used consistently
between setup and the live timer.

### Custom timer modal inputs

Passes `useTimerState`'s already-resolved `effectiveDuration`/`direction`/
`roundSecondsTotal` as `TimerMenu`'s initial values, rather than
re-deriving them from the raw stored fields — `hasCustomTimer` (used inside
`resolveEffectiveTimer`) is what correctly distinguishes a deliberate
per-table override (including an explicit `0` round time) from a table
that was never customized; comparing raw numbers/strings against the
game's default directly can't make that distinction.

### Leaving the screen

"Close timer" force-pauses every seat
([`handlePause`](../../../lib/hooks/useTimerState.md)) before navigating
away, so nothing keeps ticking unattended once nobody's looking at this device.

## Related

- [`lib/hooks/useTimerState.ts`](../../../lib/hooks/useTimerState.md) — essentially all the logic
- [`lib/hooks/useTimerLocalSettings.ts`](../../../lib/hooks/useTimerLocalSettings.md) — orientation/pause-mode preference
- [`lib/hooks/useTableBellActions.ts`](../../../lib/hooks/useTableBellActions.md)
- [`lib/bootstrap/ScreenOrientationProvider.tsx`](../../../lib/bootstrap/ScreenOrientationProvider.md)
