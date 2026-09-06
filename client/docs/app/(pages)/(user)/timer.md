# `app/(pages)/(user)/timer.tsx`

[← app](../../README.md)

## Route

`/timer?gameId=...&from=...`

## Purpose

The interactive timer screen itself — assembles
[`TimerCell`](../../../lib/components/timer/TimerCell.md) ×4,
[`TimerControlPanel`](../../../lib/components/timer/TimerControlPanel.md),
and [`TimerMenu`](../../../lib/components/timer/TimerMenu.md) around the
state and actions from
[`useTimerState`](../../../lib/hooks/useTimerState.md), which owns
essentially all of the actual logic.

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `TimerPage` (default) | `(): JSX.Element` | Screen component for `/timer?gameId=...`. Gates on `useRequireAuth()`, resolves the current player's `tableNumber` via `usePlayerTable(params.gameId)`, forces landscape orientation + keep-awake while focused (`useFocusEffect`), and renders `TimerScreenContent` keyed by `(gameId, tableNumber)`. |

### Internal: `TimerScreenContent({ gameId, tableNumber }: { gameId: string \| undefined; tableNumber: number \| null }): JSX.Element`

The actual timer UI: four `TimerCell`s in a 2x2 grid, a center `TimerControlPanel` overlay, and a `TimerMenu` for reset/custom-timer/close actions. Owns local UI state (`menuOpen`, `customTimerOpen`, `elapsedSeconds`) and delegates all timer logic to [`useTimerState`](../../../lib/hooks/useTimerState.md).

### `handleToggleBell(): Promise<void>`

If a bell is currently ringing for this table, calls `bellActions.dismiss(bell, ...)` with a translated confirm dialog; otherwise, if `tableNumber` is known, calls `bellActions.ring(tableNumber, undefined, ...)` with its own confirm dialog. Closes the menu (`setMenuOpen(false)`) only if the action actually completed (`done` is truthy), so a cancelled confirm dialog leaves the menu open.

## How it works

### `TimerScreenContent`, keyed by `(gameId, tableNumber)`

The actual screen body (everything using `useTimerState` and below) lives
in an inner `TimerScreenContent` component, rendered with
`key={`${gameId}-${tableNumber}`}` from the outer `TimerPage`.
`useTimerState` caches Appwrite doc ids (`timerDocIdRef`, `seatDocIdRef`)
and a dozen+ other per-table refs across renders, but expo-router reuses
this same screen instance across a `gameId` change (same route, just new
params) rather than remounting it. Without the `key`, switching to a
different game/table while this screen stays mounted would keep returning
the *previous* game's cached doc ids from those refs — silently skipping
creation of the new game's `Timer`/`TimerSeat` docs and writing into the
old game's docs instead. The `key` forces React to fully unmount/remount
`TimerScreenContent` (and therefore re-run `useTimerState` from scratch)
whenever the identity changes, instead of hand-resetting every affected ref
in `useTimerState` and risking missing one. `useRequireAuth`, orientation,
and the focus effect stay in the outer, unkeyed `TimerPage` — they don't
hold any per-table state, so there's no benefit to remounting them on every
game switch.

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

### Bell elapsed-time ticker

A `useEffect` keyed on `[bell]` resets `elapsedSeconds` to `0` and clears any running interval when there's no active bell; when a bell exists, it computes elapsed seconds from `bell.startTime` immediately and then every second via `setInterval`, cleaning up the interval on unmount or when `bell` changes (e.g. dismissed, or a different bell object arrives from the store).

### Leaving the screen

"Close timer" force-pauses every seat
([`handlePause`](../../../lib/hooks/useTimerState.md)) before navigating
away, so nothing keeps ticking unattended once nobody's looking at this device.
It then pops the recorded origin via
[`goBackTo`](../../../lib/utils/navigation.md), returning to the screen that
opened the timer with that screen's own params, and falls back to the `from`
route param and then `/(pages)/(user)/game?gameId=...` (or the schedule,
with no `gameId`). `from` is a route param on `TimerPage`, passed down to
`TimerScreenContent` as a prop.

## Related

- [`lib/hooks/useTimerState.ts`](../../../lib/hooks/useTimerState.md) — essentially all the logic
- [`lib/hooks/useTimerLocalSettings.ts`](../../../lib/hooks/useTimerLocalSettings.md) — orientation/pause-mode preference
- [`lib/hooks/useTableBellActions.ts`](../../../lib/hooks/useTableBellActions.md)
- [`lib/bootstrap/ScreenOrientationProvider.tsx`](../../../lib/bootstrap/ScreenOrientationProvider.md)
