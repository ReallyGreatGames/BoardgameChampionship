# `lib/components/timer/TimerCell.tsx`

[← lib/components/timer](README.md)

## Purpose

Renders one seat's clock face: player name, remaining time (pool or round,
whichever is active), a depleting color overlay, a pause/grace indicator,
and handles that seat's tap-to-pause/resume gesture. The most visually
complex single component in the app.

## Exports

### `TimerCell(props: Props): JSX.Element`

Takes the per-seat slice of [`useTimerState`](../../hooks/useTimerState.md)'s
output directly:

| Prop | Type | Meaning |
| --- | --- | --- |
| `idx` | `number` | This seat's index (0–3); drives name fallback, overlay-anchor side, and center-mode rotation. |
| `playerName` | `string \| undefined` | Display name; falls back to `P${idx + 1}` when unset. |
| `timeLeft` | `number` | Signed seconds remaining in the pool. Ticks down uniformly regardless of `direction` and can go negative once depleted. |
| `totalSeconds` | `number` | Total pool duration in seconds, used to derive the "up" display. |
| `direction` | `"up" \| "down"` | Whether the pool display counts up from 0 (elapsed) or down from `totalSeconds` (remaining). |
| `isPaused` | `boolean` | Whether this seat's clock is currently paused; drives color, the "paused" label, and the grace bar's visibility. |
| `playersInOvertime` | `boolean[]` | Per-seat overtime flags; `playersInOvertime[idx]` is this seat's own depleted state. |
| `roundSecondsTotal` | `number` | Configured round-time budget in seconds; `0` disables the round-time feature entirely. |
| `roundTimeLeft` | `number` | Seconds remaining in the current round countdown. |
| `roundExpired` | `boolean` | Whether the round countdown has hit zero. |
| `orientationMode` | `TimerOrientationMode` | `"center"` or `"side"`; controls whether this cell's content is rotated 180° for seats facing the table's far side. |
| `playerColor` | `PlayerColor` (`ReturnType<typeof buildPlayerColor>`) | This seat's `active`/`elapsed`/`muted`/`elapsedMuted` color set. |
| `depleteAnim` | `Animated.Value` | 0→1 driver for the depletion-overlay size. |
| `graceAnim` | `Animated.Value` | 0→1 driver for the grace-period progress bar and the round-badge-to-pool-time swap timing. |
| `cellSize` | `{ w: number; h: number }` | Measured cell dimensions, used as the depletion overlay's max extent. |
| `onPress` | `() => void` | Invoked when a tap gesture on this cell completes successfully. |
| `onLayout?` | `(e: LayoutChangeEvent) => void` | Forwarded RN layout callback used by the parent to measure `cellSize`. |

### Key derived values

| Name | Type | Meaning |
| --- | --- | --- |
| `isRunning` | `boolean` | `!isPaused`; shorthand used throughout for color/label selection. |
| `isDepleted` | `boolean` | `playersInOvertime[idx]`; this seat's own overtime flag. |
| `graceExpired` | `boolean` (state) | Mirrors `graceAnim` reaching ~1, delayed 400ms — see below. |
| `roundActive` | `boolean` | `roundSecondsTotal > 0 && !roundExpired`; a round budget exists and hasn't run out. |
| `showBadge` | `boolean` | `roundActive && !graceExpired`; whether the big round-countdown badge is shown instead of the big pool time. |
| `showTimeOut` | `boolean` | `isDepleted && !showBadge`; whether the "time out" label is shown. |
| `showOvertimeLook` | `boolean` | `isDepleted && !roundActive`; whether red overtime styling is applied (see "Overtime look suppression"). |
| `baseSeconds` | `number` | Displayed pool seconds: counts up from 0 (`min(totalSeconds, totalSeconds - timeLeft)`) or down from `totalSeconds` (`max(0, timeLeft)`) depending on `direction`. |
| `overageSeconds` | `number` | `max(0, -timeLeft)`; seconds over the pool budget, shown as a `+MM:SS` suffix once depleted. |
| `roundBaseSeconds` | `number` | `max(0, roundTimeLeft)`; the round countdown always drains toward zero regardless of `direction`. |
| `overlayAnchor` | `"left" \| "right" \| "top" \| "bottom"` | Which edge the depletion overlay grows from; depends on `direction` and `idx`/`isLeftCol`. |
| `overlaySize` | `Animated.AnimatedInterpolation<number>` | `depleteAnim` interpolated from `[0,1]` to `[0, overlayMax]` (cell width or height). |
| `tapGesture` | `GestureType` | `useMemo(() => Gesture.Tap().onEnd(...), [onPress])`; the tap recognizer for this cell (see "Tap handling"). |

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

The effect (`useEffect(..., [graceAnim])`) attaches one `graceAnim.addListener`
callback for the cell's lifetime and re-attaches only if the `Animated.Value`
instance itself changes. On each animation frame it checks `value >= 0.999`:
crossing that threshold arms a 400ms `setTimeout` that sets `graceExpired`
true (only once — a second frame past the threshold doesn't stack another
timer); dropping back below it clears any pending timeout and immediately
resets `graceExpired` to false, so a pause/resume that restarts the grace
countdown cancels a swap that hasn't happened yet. The cleanup function
removes the listener and clears any outstanding timeout on unmount, which
matters because `TimerCell`s are recreated per render pass of the seat grid.

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

`tapGesture: GestureType = useMemo(() => Gesture.Tap().onEnd((_event, success) => { if (success) runOnJS(onPress)(); }), [onPress])`

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
