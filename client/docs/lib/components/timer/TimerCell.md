# `lib/components/timer/TimerCell.tsx`

[← lib/components/timer](README.md)

## Purpose

Renders one seat's clock face: player name, remaining time (pool or round,
whichever is active), a depleting color overlay, a pause/grace indicator,
and handles that seat's tap-to-pause/resume gesture. The most visually
complex single component in the app.

## Props

Takes the per-seat slice of [`useTimerState`](../../hooks/useTimerState.md)'s
output directly: `idx`, `playerName`, `timeLeft`, `totalSeconds`,
`direction`, `isPaused`, `playersInOvertime`, `roundSecondsTotal`,
`roundTimeLeft`, `roundExpired`, `orientationMode`, `playerColor`,
`depleteAnim`, `graceAnim`, `cellSize`, `onPress`, `onLayout?`.

## How it works

### Round badge vs. pool time

While a round-time budget is active and running (`roundSecondsTotal > 0 &&
!roundExpired`) and its grace window hasn't fully charged
(`!graceExpired`), a large badge showing the round countdown takes over the
cell's big centered spot, and the pool time shrinks to a small line above
it. The instant the round expires — or its own grace window runs out while
paused — the badge disappears and the pool time takes back the big spot,
exactly as if there were no round-time feature at all.

`graceExpired` is state, not just a derived animation interpolation — it
mirrors `graceAnim` reaching ~1 (fully charged) into real component state
(with the transition delayed 400ms past the threshold, so the grace bar
visibly finishes filling before the swap happens) so the badge's *layout*
disappears at the right moment, not just its opacity.

### Overtime look suppression

While a round is active, the "overtime" red styling is suppressed even if
this seat's pool is already negative from an *earlier* round — showing red
would be misleading since the current round itself hasn't run out yet
(`showOvertimeLook = isDepleted && !roundActive`).

### Depletion overlay direction

The colored overlay that grows as a seat's pool depletes anchors to a
different edge depending on both `direction` (`"up"`/`"down"`) and which
half of a 4-seat layout the cell is in (`isLeftCol`) — see
`overlayAnchor`/`overlayStyle`. For a non-4-seat layout it anchors
top/bottom instead of left/right.

### Base time computed from `timeLeft`

`timeLeft` always ticks down uniformly regardless of `direction` and can go
negative once the pool is exhausted (see
[`useTimerState`](../../hooks/useTimerState.md)) — `baseSeconds` derives
the *displayed* value from it depending on direction (counting up from 0,
or down from the total), while `overageSeconds` (`max(0, -timeLeft)`) is
shown separately as a `+MM:SS` overage, symmetric for both directions.
Round time (`roundBaseSeconds`) always counts down regardless of the
pool's direction — it's a fixed budget draining toward zero, not a running total.

### Tap handling

Uses `react-native-gesture-handler`'s `Gesture.Tap()` (via
`GestureDetector`), deliberately **not** `Pressable`/`Touchable`: RN's
legacy responder system negotiates a single active JS responder per touch
stream, which makes two players pressing two different seats' cells at the
same instant unreliable (one press gets delayed or swallowed). Each
`GestureDetector` runs its own native gesture recognizer, so sibling cells
genuinely recognize simultaneous taps. Fires on `onEnd` (not `onStart`) to
mirror `Pressable`'s `onPress` timing, and only when `success` is true
(the recognizer didn't cancel the tap — finger dragged too far / held too long).

## Used by

- [`app/(pages)/(user)/timer.tsx`](../../../app/(pages)/(user)/timer.md)

## Related

- [`lib/hooks/useTimerLocalSettings.ts`](../../hooks/useTimerLocalSettings.md) — `orientationMode`
- [`lib/utils/timerColors.ts`](../../utils/timerColors.md) — `playerColor`
