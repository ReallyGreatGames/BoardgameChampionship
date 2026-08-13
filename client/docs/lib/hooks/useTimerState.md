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

Returns per-seat tick state (`times`, `roundTimesLeft`, `roundExpired`,
`playersInOvertime`, `playersPaused`), `allPaused`, `tableElapsedSeconds`,
animation refs (`depleteAnims`, `graceAnims`), resolved settings
(`totalSeconds`, `effectiveDuration`, `roundSecondsTotal`, `direction`,
`playerColors`), layout state (`cellSize`, `handleCellLayout`), and the
action handlers `handlePress`, `handlePause`, `handleReset`,
`handleSaveCustomTimer`, `handleUseDefaultTimer`, `toggleAllPause`, plus the
raw `existingTimer`/`timerSettings` documents.

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

### Raw vs. server-corrected pause timestamp (`roundLastPausedAtRef` vs. `correctedLastPausedAtRef`)

`roundLastPausedAt` is authored by whichever device paused a seat, using
*its own* clock, and feeds two different consumers with opposite tolerance
needs:
- The **grace-bar animation** (`syncGraceAnimation`) uses the raw value —
  cosmetic, so a late-discovered pause just animating less is preferable to
  a "corrected" version reading as already-expired on almost every remote sync.
- The **round-reset decision** (`resumeRoundState`'s grace check) uses a
  server-anchored variant, substituting the seat doc's own `$updatedAt` for
  the acting device's self-reported timestamp — this removes that device's
  clock skew from a security/fairness-relevant decision. Forcing the
  animation through the same substitution would make a cross-device resume
  read as "outside grace" almost every time, purely from realtime delivery
  lag (which can be multiple real seconds) — hence the two refs stay separate.

### Grace window (`ROUND_RESET_GRACE_MS`, `resumeRoundState`, `syncGraceAnimation`)

A seat resumed within 3000ms of its own pause keeps its round time instead
of resetting — prevents "reset my round time" abuse via quick
pause/unpause. `syncGraceAnimation` (re)starts a seat's grace-bar animation
from how much of that window has *actually* elapsed (wall-clock), rather
than always animating a fresh 3s — so the local pause action and the later
cross-device sync of that same pause land on essentially the same visual
state instead of visibly jumping. A `null` `lastPausedAtIso` on a seat with
no prior pause is treated as "grace doesn't apply" (`anim.setValue(0)`),
not "already elapsed" — treating it as elapsed made `TimerCell` hide the
round badge for a round that hadn't even started, since a brand-new seat's
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

## Used by

- [`app/(pages)/(user)/timer.tsx`](../../app/(pages)/(user)/timer.md)

## Related

- [`lib/utils.ts`](../utils.md) — `resolveEffectiveTimer`, `reconcileRoundAndPool`, `computeTableElapsedSeconds`
- [`lib/utils/timerColors.ts`](../utils/timerColors.md)
- [`lib/hooks/useSecureStoragePerGame.ts`](useSecureStoragePerGame.md) — player-color storage
- [`lib/hooks/useTimerLocalSettings.ts`](useTimerLocalSettings.md) — supplies `pauseMode`
- [`lib/components/timer/`](../components/timer/README.md) — the UI consuming this hook
