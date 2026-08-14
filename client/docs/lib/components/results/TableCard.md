# `lib/components/results/TableCard.tsx`

[← lib/components/results](README.md)

## Purpose

One table's card in the admin overview grid: read-only live timer state
(while a game is running) or placement/score chips (once results exist),
plus bell and signature status. The read-only "dashboard" counterpart to
the interactive [`TimerCell`](../timer/TimerCell.md).

## Props

`{ entry: TableEntry, cardWidth: number, now: number, onPress?: () => void,
onBellPress?: () => void, bellLoading?: boolean }` — `now` is passed in
(rather than read internally) so every card on screen re-renders off the
same shared per-second tick from the parent, instead of each card running
its own timer.

## How it works

### Per-seat fallbacks for missing documents

Since each timer seat is its own Appwrite document (see
[`TimerSeat`](../../models/timer-seat.md)), a seat that's never been
touched simply has no document in `entry.seats` — `seatByIndex` resolves
each of the 4 seat slots to either its document or `undefined`, and every
derived value (`storedTimes`, `pausedFlags`, `roundTimesLeft`,
`roundExpired`, `overtimeFlags`) falls back to the same defaults
[`useTimerState`](../../hooks/useTimerState.md) itself uses for a
never-touched seat (full pool, paused, fresh round, not in overtime).

### Live reconciliation without a tick loop

Unlike the interactive timer, this card has no local per-second countdown
of its own — instead, `playerTimes` calls
[`reconcileRoundAndPool`](../../utils.md) fresh on every `now` update
(fast-forwarding each running seat from its own last-saved `$updatedAt`),
so pool time never appears to drain while a seat is in its round-time
phase, matching the live timer's behavior exactly. Skipped entirely once
`entry.isSubmitted` — a submitted result's stored times are shown as-is,
never reconciled forward.

### Table-elapsed time

Same derivation as `useTimerState`'s `tableElapsedSeconds`: accumulated
milliseconds from past active stretches, plus (while a seat is still
running) wall-clock time since `tableActiveResumedAt`. Rendered `null`
(and hidden) rather than `0` when the timer's never been touched at all,
to tell "never started" apart from a genuine zero.

### Overtime look is NOT suppressed during an active round

Deliberately differs from [`TimerCell`](../timer/TimerCell.md)'s
`showOvertimeLook`: on the live (player-facing) timer, showing red mid-round
for an already-overtime-from-an-earlier-round seat would be a confusing UX
choice, so it's suppressed there. This staff-facing dashboard makes the
opposite call — it should always show a seat's real pool overage,
regardless of whether a fresh round is currently running on top of it. The
overtime flag used here is also OR'd with the already-reconciled live pool
time (`(overtimeFlags[i] ?? false) || (playerTimes[i] ?? 0) <= 0`), since
the persisted flag can lag behind (only rewritten on the live timer's next
press/pause).

### Overage display for both directions

`formatPlayerTime` shows `+MM:SS` once a seat is in overtime regardless of
`timerDirection` — plain [`formatTime`](../../utils.md) clamps negative
values to `00:00`, which would otherwise freeze the display at zero for
"down" timers and let "up" timers grow silently past the total, neither of
which shows how far over anyone actually is.

## Used by

- [`lib/components/results/ResultsAdminTab.tsx`](ResultsAdminTab.md)
