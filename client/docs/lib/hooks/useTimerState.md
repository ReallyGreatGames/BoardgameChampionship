# `lib/hooks/useTimerState.ts`

[← lib/hooks](README.md)

## Purpose

The entire interactive chess-clock-style table timer: local per-second
ticking, cross-device sync via Appwrite realtime, pause/resume, round-time
handling, custom timers, and auto-ringing the table bell on timeout. This
is the single most complex piece of client-side logic in the app.

## Exports

### `useTimerState({ gameId, tableNumber, bell, pauseMode })`

| Param | Type | Meaning |
|---|---|---|
| `gameId` | `string \| undefined` | Current game |
| `tableNumber` | `number \| null` | Current table |
| `bell` | [`TableBell`](../models/table-bell.md) `\| undefined` | This table's current bell, if any |
| `pauseMode` | [`TimerPauseMode`](useTimerLocalSettings.md) | `"auto"` (one active seat at a time) or `"manual"` (independent seats) |

Returns an object (`PLAYER_COUNT = 4`, so every per-seat array below always
has exactly 4 entries, indexed by seat):

| Property | Type | Meaning |
|---|---|---|
| `times` | `number[]` | Each seat's remaining pool time, in seconds. |
| `roundTimesLeft` | `number[]` | Each seat's remaining round time, in seconds (meaningless while `roundSecondsTotal === 0`). |
| `roundExpired` | `boolean[]` | Whether each seat's round budget has hit zero (further ticks drain pool time instead). |
| `playersInOvertime` | `boolean[]` | Whether each seat's pool time has hit zero. |
| `playersPaused` | `boolean[]` | Whether each seat is currently paused (not ticking). |
| `allPaused` | `boolean` | `playersPaused.every(Boolean)` — true only when every seat is paused. |
| `spamProtectionActive` | `boolean` | `true` while input is being throttled after a burst of rapid presses (see How it works). |
| `tableElapsedSeconds` | `number` | Total wall-clock seconds the table has been "active" (at least one seat running), computed from the table doc's accumulated-ms/resumed-at fields plus any currently-live running span. |
| `depleteAnims` | `React.RefObject<Animated.Value[]>` | One `Animated.Value` per seat (0 → 1) driving the pool-time depletion bar; mutated directly, not through React state. |
| `graceAnims` | `React.RefObject<Animated.Value[]>` | One `Animated.Value` per seat (0 → 1) driving the round-reset grace-period bar; see the grace-bar sync section below. |
| `totalSeconds` | `number` | The full per-seat pool-time budget in seconds (`effectiveDuration` minutes split evenly across `PLAYER_COUNT`, or `DEFAULT_SECONDS` if no duration is configured). |
| `effectiveDuration` | `number \| undefined` | The resolved total timer duration in minutes, from [`resolveEffectiveTimer`](../utils.md) — the custom-timer value if `hasCustomTimer`, else the game's configured default. |
| `roundSecondsTotal` | `number` | The resolved per-round time budget in seconds; `0` means round-timing is disabled and only pool time counts down. |
| `direction` | `"up" \| "down"` | Whether elapsed pool time should be *displayed* counting up or down (see [`TimerCell`](../components/timer/TimerCell.md)) — doesn't affect the underlying countdown mechanics. |
| `playerColors` | `{ active: string; muted: string; elapsed: string; elapsedMuted: string }[]` | Per-seat color set (one entry per seat), from either this device's stored custom colors or the game's default palette. |
| `cellSize` | `{ w: number; h: number }` | Last-measured size of a timer cell, updated via `handleCellLayout`; seeded from half the window dimensions before any layout event fires. |
| `handleCellLayout` | `(e: LayoutChangeEvent) => void` | Layout-event handler wired to a timer cell's `onLayout`; updates `cellSize` from the fired event. |
| `handlePress` | `(idx: number) => void` | Toggles seat `idx` between paused/running (see Actions below). |
| `handlePause` | `() => void` | Force-pauses every running seat (see Actions below). |
| `handleReset` | `() => Promise<boolean>` | Shows a confirm dialog, then (if confirmed) resets every seat back to the current duration/round budget and persists it; resolves `false` without any change if the user cancels, `true` otherwise. |
| `handleSaveCustomTimer` | `(durationMinutes: number, dir: "up" \| "down", newRoundSeconds: number) => Promise<void>` | Resets every seat to a new custom budget and persists both the table's new `durationMinutesTotal`/`roundSecondsTotal`/`direction`/`hasCustomTimer: true` and every seat's fresh state. No confirmation dialog — the caller (a settings modal) is itself the confirmation step. |
| `handleUseDefaultTimer` | `() => Promise<boolean>` | Shows a confirm dialog, then (if confirmed) resets every seat to the game's default duration/round budget and persists `hasCustomTimer: false` (without clearing the old custom values — see How it works). Resolves `false` without any change if cancelled, `true` otherwise. |
| `toggleAllPause` | `() => void` | Unconditionally flips every seat between fully paused and fully running (see Actions below). |
| `existingTimer` | [`Timer`](../models/timer.md) `\| undefined` | The raw table-wide Appwrite document for this table/game, if one has been created yet. |
| `timerSettings` | `Game \| undefined` | The raw game document supplying this game's default timer duration/round/direction/colors, if the game is known to [`useTimerSettingsStore`](../stores/appwrite/timer-settings-store.md). |

## Data model recap

Timer state is split across two Appwrite document types (see
[`lib/models`](../models/README.md) for why): one table-wide
[`Timer`](../models/timer.md) document, and one [`TimerSeat`](../models/timer-seat.md)
document per seat (`PLAYER_COUNT = 4`). Splitting by seat means two devices
touching different seats touch different Appwrite rows — there's nothing
left for a stale write to clobber.

## How it works

### Pool time vs. round time

Each seat has two independent countdowns: **round time** (a short
per-turn budget, if `roundSecondsTotal > 0`) and **pool time** (the seat's
overall remaining budget). The per-second tick effect drains round time
first; once a seat's round expires (`roundExpired`), further ticks drain
its pool instead. `direction` only changes how remaining pool time is
*displayed* (see [`TimerCell`](../components/timer/TimerCell.md)) — the
underlying countdown always ticks the same way regardless.

### Cross-device sync: the core problem

Every device runs its own local tick loop (`setInterval`, 1s) and also
watches Appwrite realtime for what every *other* device is doing to the
same table. The hard part is telling apart three situations for an
incoming seat-document update:

1. **This device's own write, echoing back.** Should be ignored entirely —
   re-deriving from it would double-count the save's own round-trip latency.
2. **A genuinely new update from another device.** Should be applied.
3. **A stale/out-of-order update** (an initial fetch or reconnect refetch
   landing after a newer local write already applied). Should be ignored.

### Same-tick multi-touch safety (`playersPausedRef`, `tickStateRef`)

`handlePress`, `toggleAllPause`, and `handlePause` all read the *current*
pause/tick state and write the *next* one — but they read and write
`playersPausedRef.current`/`tickStateRef.current`, never the
`playersPaused`/`tickState` state variables directly, and update both refs
synchronously before calling `setPlayersPaused`/`setTickState`. This
matters specifically for real simultaneous multi-touch: pressing two
different seats at (near enough) the same physical instant can invoke
`handlePress` twice before React re-renders in between (React defers the
re-render — that's what batching means), so anything reading the
`playersPaused`/`tickState` state variables directly would have both calls
compute their "next" values from the *same* pre-press snapshot, and the
second `setPlayersPaused` call would silently overwrite the first's result
— i.e. only the last-processed touch would ever actually register, which
reads exactly like "multi-touch doesn't work" even though the underlying
gesture recognition (`Gesture.Tap()` per seat, see
[`TimerCell`](../components/timer/TimerCell.md)) is doing its job fine.
Refs update immediately regardless of React's render timing, so the second
call always sees the first's result. The remote-sync effect's own
`setPlayersPaused`/`setTickState` calls follow the same pattern (compute
from the refs, write the refs, then call the setters) for the same reason,
even though a same-tick collision between a remote sync and a local press
is a much rarer case in practice than two local touches.

### Spam protection (`registerPressAndCheckSpam`, `spamProtectionActive`)

A burst of rapid presses across all four seats (or repeatedly toggling
pause-all) fires that many concurrent Appwrite writes — every seat is its
own document (see the data model recap above), so there's no client-side
batching of these calls, and enough of them close together can trip
Appwrite's own rate limiting. A write that fails there isn't retried with
backoff (`persistSeatPatch`'s failure handling assumes the doc might be
missing, not that the request was throttled) — it just silently never
lands, leaving this device's already-applied local/optimistic state with
nothing to show for it on any other device watching the same table.

`registerPressAndCheckSpam` is called at the top of `handlePress` and
`toggleAllPause` (not `handlePause` — that's a leave-the-screen safety
action, not something a user mashes) and tracks press timestamps in
`pressHistoryRef`, a sliding window of the last `SPAM_WINDOW_MS`. More than
`SPAM_MAX_PRESSES` within that window blocks every further press for
`SPAM_COOLDOWN_MS` (returns `false`, so the caller does nothing at all —
no local state change, no network write) and flips `spamProtectionActive`
to `true` for that same duration, which
[`TimerControlPanel`](../components/timer/TimerControlPanel.md) shows as a
banner and uses to disable the pause-all button.

This deliberately throttles at the *input* layer, not the network layer —
an earlier design considered pacing the Appwrite writes themselves (spacing
out calls to stay under the limit) instead of blocking presses, but that
delays *every* write, including on a rapid-but-not-spammy burst, which
means other devices watching the table would see the update later than
they do today. Blocking further input outright, with a visible reason
shown to the user, keeps every write that does happen fully realtime.

### Own-echo detection (`pendingWritesRef`, `pausedAtRoughlyEqual`)

Every write this device sends via `persistSeatPatch` is recorded in
`pendingWritesRef[seat]` (a queue, not a single slot — spamming a button
fires several writes before their echoes round-trip back, and each must be
matched individually; matching only the most recent write would let an
earlier click's echo, arriving after a newer click overwrote the slot, be
misread as a genuinely remote change). An incoming update is recognized as
this device's own echo if every field it actually controls
(`playerTime`, `paused`, `roundTimeLeft`, `roundExpired`) matches
byte-for-byte AND `roundLastPausedAt` matches within
`OWN_ECHO_TIMESTAMP_TOLERANCE_MS` (1500ms) via `pausedAtRoughlyEqual` —
tolerant rather than exact, because `roundLastPausedAt` round-trips through
Appwrite's datetime storage, which can reformat the string (dropped
milliseconds, timezone notation), and re-parsing this device's own
just-written value back off the echo risks misreading it — which the
grace-bar timing is sensitive to. Exact-string equality was tried and
rejected: it correctly avoids that reformatting risk, but two devices that
each did their own quick pause/unpause on a freshly-reset timer can
produce byte-identical values purely by coincidence, so *skipping* the
timestamp field entirely made one device mistake the other's genuinely new
update for its own echo. On a match, every older queued write for that seat
is dropped too (writes reach Appwrite in strict order via `writeChainRef`,
so a match this deep means every older entry already landed).

Because matching is by value, not by an explicit device/origin marker,
an entry that's never matched sits in the queue forever and can later
coincidentally match a genuinely different remote update with the same
field values — plausible for pause-all/reset/start-stop, which force seats
to the same predictable, often-repeated values. Two things guard against
this: the match check runs (and prunes matched-and-older entries) *before*
the stale-update check below, not after — a delayed echo of this device's
own write can itself arrive "stale" (superseded by a newer doc already
processed), and running the stale check first would discard it without
ever reaching the match/clear step, permanently stranding that entry.
`PENDING_WRITE_MAX_AGE_MS` (15s) is the second guard: entries older than
that are dropped before matching is attempted at all, on the assumption
that any real echo would have round-tripped well before then, so nothing
that old is worth risking a coincidental match against.

### Creating a doc with its final values directly (`getOrCreateSeatDocId`/`getOrCreateTimerId`, the `created` flag)

The very first time a seat (or the table) is touched, there's no existing
Appwrite doc yet — `persistSeatPatch`/`persistTablePatch` need to create one.
Creating it with hardcoded placeholder defaults (e.g. `paused: true`) and
then immediately sending a second `update` call with the real intended
values (e.g. `paused: false`, for "press start on a never-touched seat")
used to cause exactly that: the seat visibly started, then instantly
paused again, on the very first press only. The two writes race: the
`create`'s own realtime echo (still carrying the placeholder defaults)
isn't recognized by the own-echo detection above, because
`pendingWritesRef` only ever recorded the *second* write's (real) values —
so if that `create` echo is processed before the follow-up `update`'s echo
arrives, the placeholder `paused: true` briefly reads as a genuinely new
remote change and overwrites the local optimistic "started" state, which
then flips back once the `update` echo catches up moments later.
`getOrCreateSeatDocId`/`getOrCreateTimerId` fix this by accepting the
patch that's about to be persisted and merging it into the doc at creation
time — one write, carrying the final values from the start, so there's no
placeholder state for a stray echo to reintroduce. Both return
`{ id, created }`; `persistSeatPatch`/`persistTablePatch` skip their normal
follow-up `update` call whenever `created` is true, since the doc already
holds those exact values.

### Stale-update protection (`latestSeenSeatUpdatedAtRef` / `latestSeenTableUpdatedAtRef`)

Belt-and-suspenders alongside `updateRealtimeCollectionUpdate`'s own
last-write-wins check in [`real-time-store.ts`](../stores/real-time-store.md):
that check protects the *store's* collection array, but a plain collection
replace (the initial fetch, or a reconnect's refetch) bypasses it entirely
— it's a raw `set`, not routed through the realtime merge logic. These refs
track the highest `$updatedAt` actually applied per seat/table so a refetch
reflecting a moment before an in-flight write committed can't silently jump
state backward.

### Object-identity short-circuit (`lastProcessedSeatDocRef`)

`existingSeats` is one combined memo over all four seats, so pressing *one*
seat re-runs the sync effect for every seat, not just the one that changed.
An untouched seat's entry in the underlying collection keeps the exact same
object reference (see `updateRealtimeCollectionUpdate`, which only replaces
the one matching document) — this ref lets the effect skip re-deriving a
seat whose document object hasn't changed at all, which matters because
re-deriving would otherwise snap that seat's locally-ticked-down value back
to its last-saved checkpoint (checkpoints only happen on press/pause/reset,
not every tick).

### Raw vs. server-corrected pause timestamp (`roundLastPausedAtRef`, `correctedLastPausedAtRef`)

`roundLastPausedAt` is authored by whichever device paused a seat, using
*its own* clock — any consumer that compares it against *this* device's
`Date.now()` inherits that device's clock skew relative to the pausing one.
The **round-reset decision** (`resumeRoundState`'s grace check) uses
`correctedLastPausedAtRef`, which substitutes the seat doc's own
`$updatedAt` for the acting device's self-reported timestamp — but only
once this device has already hydrated the seat at least once.
`isFirstHydration` (a seat's very first sync since this device mounted/
reconnected) still uses the raw value here: at that point `$updatedAt`
reflects whatever the *last* write to the doc was, which could be long
before this device connected and isn't a meaningful "just paused" anchor
for a functional decision — the narrower clock-skew risk in this one-time
case is an accepted trade-off for that decision specifically.

### Grace-bar sync: live updates vs. catch-up (the seat-sync effect's `paused && !isFirstHydration` branch)

Two categorically different situations both call `syncGraceAnimation`
during the seat-sync effect, and were originally handled identically (both
seeding from computed elapsed-since-pause) before three rounds of chasing
increasingly precise cross-device clock reconciliation each failed to fix
a reported "grace bar runs too fast or too slow, or starts partway filled,
on a remote device" bug — see git history on this file for the abandoned
attempts (raw vs. server-anchored timestamp; a `clockOffsetEstimateRef`
device-clock-drift estimator). Real captured numbers from testing showed
why: comparing two independently-clocked devices' timestamps over a live
realtime channel is only accurate to within a few hundred ms to low
seconds of jitter — nowhere near enough for a 3-second animation where
every ~100ms is visible. The fix was to stop needing that precision at all
for the case where it actually shows:
- **A genuinely live pause, already-watching device** (`paused &&
  !isFirstHydration`) — the common case, and the one actually being
  watched by a user. Plays the *exact* same fresh `0 → 1` animation over the
  full `ROUND_RESET_GRACE_MS`, timed from the moment THIS device's effect
  runs — i.e. treated exactly like a local pause (see `syncGraceAnimation`
  below), using only this device's own clock. Zero cross-device timestamp
  math, so zero possible skew/jitter error. The only remaining discrepancy
  versus the pausing device is a small, one-directional, honest start-time
  delay (real realtime delivery lag, typically well under a second) — never
  a rate distortion, which is what was actually reported broken.
- **First hydration (mount/reconnect mid-window), or transitioning to
  unpaused** — anchors on `seatDoc.$updatedAt` (server clock, removing the
  *pausing* device's clock as an error source) further corrected by
  `clockOffsetEstimateRef`'s estimate of *this* device's own clock drift
  (see below). Imprecise, but this path only ever needs to roughly tell
  "still within grace" from "long since expired" for a seat this device is
  just now catching up on — not sub-second accuracy — so the same jitter
  that broke the live case doesn't matter here.

### This device's own clock skew (`clockOffsetEstimateRef`, `updateClockOffsetEstimate`)

Used only by the catch-up path above. There's no NTP-style call anywhere in
this app to ask the server "what time is it" directly, so
`clockOffsetEstimateRef` estimates this device's own clock drift relative
to the server opportunistically from data already flowing through this
hook: every seat/table doc update this device processes carries a
`$updatedAt` it can compare against its own `Date.now()` at receipt.
`updateClockOffsetEstimate` keeps the **maximum** `$updatedAt − localNow`
sample seen so far (called from both the per-seat loop and the table-level
sync effect, for every update, not just pauses — own echoes count too, more
samples only sharpen the estimate). Network delivery lag can only push a
sample more negative (receipt always happens after the server write, never
before), never more positive, so the least-negative sample seen so far is
the best available estimate of this device's actual clock drift, and only
ever improves as more updates arrive. Still only accurate to within roughly
a second even once well-sampled — fine for the coarse catch-up decision,
which is why the live path above doesn't use it at all.

The temporary `[DEBUG-grace7f3]`-tagged logs are still in the code pending
confirmation the live/catch-up split resolves the reported bug; remove them
once confirmed.

### Grace window (`ROUND_RESET_GRACE_MS`, `resumeRoundState`, `syncGraceAnimation`)

A seat resumed within 3000ms of its own pause keeps its round time instead
of resetting — prevents "reset my round time" abuse via quick
pause/unpause. `syncGraceAnimation` takes an already-resolved `now` and
`lastPausedAtIso` and seeds/starts the bar from however much of the window
has elapsed between them — it doesn't itself know or care whether the
caller is a local pause, a live remote sync, or a reconnect catch-up; see
the section above for how each of those three call sites resolves what to
pass in (local: always elapsed 0; live remote: also always elapsed 0, same
as local; catch-up: genuinely computed, imprecisely). The `Animated.timing`
call is pinned to `easing: Easing.linear` — a syncing device that
legitimately does seed mid-flight (the catch-up path) restarts the
animation from a non-zero value; `Animated.timing`'s *default* easing
(`Easing.inOut(Easing.ease)`, unless overridden) is not self-similar,
so replaying its curve from an arbitrary seed onward traces a visibly
different value-over-time shape than the original curve would have past
that point. Linear easing is the one shape where a restart from any point
exactly continues the original trajectory, which is why it's forced
explicitly here instead of relying on the (non-linear) library default.
A `null` `lastPausedAtIso` on a seat with no prior pause is treated as
"grace doesn't apply" (`anim.setValue(0)`), not "already elapsed" —
treating it as elapsed made `TimerCell` hide the round badge for a round
that hadn't even started, since a brand-new seat's
very first sync goes through here with `roundLastPausedAt === null`.

### Table-wide "active" bookkeeping (`tableActiveTransition`)

The table's total elapsed running time is derived, not live-written every
tick (see [`Timer`](../models/timer.md)'s `tableActiveAccumulatedMs`/
`tableActiveResumedAt`). `tableActiveTransition` computes the doc patch
only when a pause/resume action actually crosses the
"nobody running" ⇄ "someone running" boundary — called explicitly from
every seat-pause action (`handlePress`, `toggleAllPause`, `handlePause`)
rather than from a generic effect watching `allPaused`, because an effect
can't distinguish a *local* action's transition from this device simply
catching up to an already-running table on mount/reconnect — which would
otherwise reset `tableActiveResumedAt` to "now" and silently drop whatever
elapsed time the table had already accumulated before this device connected.

### Actions

- **`handlePress(idx)`** — toggles one seat. In `"auto"` pause mode,
  activating a paused seat force-pauses every other running seat first
  (classic single-active-player feel); `"manual"` mode skips this. Only
  seats actually touched by this action get a fresh write (previously,
  before the per-seat document split, every press had to resend all four
  seats since they shared one document).
- **`toggleAllPause()`** — unconditionally flips every seat between fully
  paused and fully running (used by the explicit pause-all/resume-all
  control, and also called automatically when switching from `"manual"` to
  `"auto"` mode while more than one seat is running — auto mode's
  single-active-seat invariant would otherwise be silently violated until
  the user happened to press one of the seats).
- **`handlePause()`** — force-pauses every running seat; used when leaving
  the timer screen so nothing keeps ticking unattended.
- **`handleReset()` / `handleSaveCustomTimer(...)` / `handleUseDefaultTimer()`** —
  all funnel through `resetTimerLocally` (shared reset of local
  state/animations) and `persistAllSeatsFresh` (shared per-seat persistence
  of the fresh state); they differ only in which budget to reset to and
  which table-wide fields (if any) to persist alongside it.
  `handleUseDefaultTimer` only persists `hasCustomTimer: false` — it
  deliberately does *not* null out the old duration/round/direction values,
  since [`resolveEffectiveTimer`](../utils.md) already ignores those fields
  entirely once `hasCustomTimer` is false.

### Auto-ringing the table bell

A dedicated effect tracks each seat's overtime flag independently
(`bellFiredRef`, per seat, not one shared flag) — `"manual"` mode allows
several seats to run and time out independently, so one seat's
already-acknowledged bell must not silently swallow a *different* seat's
fresh timeout. If an unacknowledged bell already exists for the table, no
duplicate is created; if an already-acknowledged bell exists, it's re-rung
(updated) rather than creating a second row — the deterministic bell id
(see [`table-bell-store.ts`](../stores/appwrite/table-bell-store.md)) only
allows one row per table anyway.

#### The bell rings on a *crossing* into overtime, not on seeing overtime

`bellFiredRef` is a per-mount ref, so a seat that is *already* in overtime
the first time this client hydrates it is seeded as already-fired (in the
hydration effect, gated on that seat's `isFirstHydration`) instead of being
treated as a fresh timeout.

Without that seeding the bell was effectively unstoppable, because
rediscovering an old expiry looks identical to a new one:

- an admin dismisses the locked bell → the row is gone → the next client to
  mount the timer screen for that table sees `inOvertime` with a blank
  `bellFiredRef` and immediately re-creates it, locked, so players still
  can't clear it;
- an admin acknowledges the bell → the "already acknowledged, re-ring it"
  branch fires on the next mount and writes `acknowledgeTime: null` +
  `locked: true` + a fresh `startTime`, silently undoing the
  acknowledgement.

With four players plus admins moving between the game and timer screens,
those remounts happen constantly, so the bell kept resurrecting itself.

The tradeoff: if every client leaves the timer screen while a seat is
running and the seat crosses zero unobserved,
[`reconcileRoundAndPool`](../utils.md) surfaces the expiry on the next
hydration but no bell is auto-rung for it — the table can still ring
manually. Auto-ringing that case is what made a dismissed bell come back.

## Used by

- [`app/(pages)/(user)/timer.tsx`](../../app/(pages)/(user)/timer.md)

## Related

- [`lib/utils.ts`](../utils.md) — `resolveEffectiveTimer`, `reconcileRoundAndPool`, `computeTableElapsedSeconds`
- [`lib/utils/timerColors.ts`](../utils/timerColors.md)
- [`lib/hooks/useSecureStoragePerGame.ts`](useSecureStoragePerGame.md) — player-color storage
- [`lib/hooks/useTimerLocalSettings.ts`](useTimerLocalSettings.md) — supplies `pauseMode`
- [`lib/components/timer/`](../components/timer/README.md) — the UI consuming this hook
