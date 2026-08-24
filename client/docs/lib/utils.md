# `lib/utils.ts`

[← docs](../README.md)

## Purpose

General, stateless helper functions needed by several otherwise-unrelated
parts of the app (timer logic, import services, result rendering).
Deliberately separate from [`lib/utils/`](utils/README.md) (more
specialized utility modules).

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `EMPTY` | `Symbol` | Sentinel value for "no value" (distinguishable from `undefined`/`null`) |
| `WRITE_PACING_MS` | `number` (`750`) | Shared delay between consecutive Appwrite write calls in the import/wipe services, to stay under Appwrite's rate limit during bulk operations |
| `sleep(ms)` | `(number) => Promise<void>` | Promise-based delay |
| `withRetry(fn, options)` | `<T>(() => Promise<T>, opts) => Promise<T>` | Re-runs `fn` with exponential backoff as long as `shouldRetry(error)` is true (default: always, max 4 attempts, initial delay 1000ms, doubling each attempt) |
| — `options.maxRetries` | `number` (default `4`) | Max number of retries after the first attempt |
| — `options.initialDelay` | `number` (default `1000`) | Delay in ms before the first retry; doubles after every subsequent failure |
| — `options.shouldRetry` | `(error: unknown) => boolean` (default always `true`) | Predicate deciding whether a given error is retryable; when it returns `false` the error is rethrown immediately |
| `addMinutesToTime(time, minutes)` | `(string, number) => string` | Adds minutes to an `"HH:MM"` time, with 24h wraparound |
| `deepClone(obj)` | `<T>(T) => T` | Deep copy via JSON round-trip |
| `formatTime(s)` | `(number) => string` | Seconds → `"MM:SS"`, negative values are clamped to 0 |
| `formatElapsed(startTime, now)` | `(string, number) => string` | Time elapsed since `startTime` (ISO) → `"MM:SS"` |
| `formatElapsedSeconds(seconds)` | `(number) => string` | Seconds → `"MM:SS"` (without a start-time calculation) |
| `computeTableElapsedSeconds(accumulatedMs, resumedAtIso, now)` | see below | Table-wide elapsed time in seconds |
| `reconcileRoundAndPool(...)` | see below | Fast-forwards timer values over elapsed real time |
| `toNumberArray(value)` / `toBooleanArray(value)` | `(unknown) => number[] / boolean[]` | Normalizes realtime payloads that may serialize arrays as a JSON string |
| `arraysEqual(a, b)` | `<T>(T[], T[]) => boolean` | Value-equality for flat arrays (cheaper than a `JSON.stringify` comparison) |
| `resolveEffectiveTimer(timer, gameSettings)` | see below | Resolves the timer settings that actually apply to a table |
| `teamName(player)` | `(Player) => string` | Team name, whether Appwrite returns a hydrated `Team` object or just the `$id` |
| `injectViewBox(xml)` | `(string) => string` | Injects a missing `viewBox` attribute into signature SVGs |
| `resolveGameId(ref)` | `(unknown) => string \| null` | Normalizes Appwrite relation fields (string, object, or array) into a game id |
| `EffectiveTimerSettings` | Type | Return type of `resolveEffectiveTimer` |
| `RoundPoolReconcileResult` | Type | Return type of `reconcileRoundAndPool` |

`EffectiveTimerSettings` properties:

| Property | Type | Meaning |
|---|---|---|
| `hasCustomTimer` | `boolean` | Whether the table overrides the game's default timer settings |
| `effectiveDuration` | `number \| undefined` | The duration (minutes) that actually applies — table's own if customized, else the game's default |
| `roundSecondsTotal` | `number` | The round-timer length (seconds) that actually applies (`0` = disabled) |
| `direction` | `NonNullable<Timer["direction"]>` | Count-up/count-down direction that actually applies |

`RoundPoolReconcileResult` properties:

| Property | Type | Meaning |
|---|---|---|
| `poolTimes` | `number[]` | Recomputed per-seat pool-time remaining, in seconds |
| `roundTimesLeft` | `number[]` | Recomputed per-seat round-time remaining, in seconds |
| `roundExpired` | `boolean[]` | Recomputed per-seat "round timer hit zero" flags |

## How the more complex functions work

### `computeTableElapsedSeconds(accumulatedMs: number, resumedAtIso: string | null | undefined, now: number): number`

- `accumulatedMs` — milliseconds already banked from past active (running,
  not paused) stretches at this table.
- `resumedAtIso` — ISO timestamp of when the table was last resumed, or
  `null`/`undefined` if it's currently paused/never started.
- `now` — current time in epoch ms (caller-supplied so the function stays
  pure/testable).

Table-wide elapsed time is **not** stored as a live-ticking counter, but
derived: accumulated milliseconds from past "active" stretches, plus —
while `resumedAtIso` is set — wall-clock time since that moment. Used by
both the live timer ([`useTimerState`](hooks/useTimerState.md)) and the
read-only results dashboard ([`TableCard.tsx`](components/results/TableCard.md)),
so the two are guaranteed to compute the same value (see the doc comments
on `tableActiveAccumulatedMs`/`tableActiveResumedAt` in
[`Timer`](models/timer.md)).

### `reconcileRoundAndPool(poolTimes: number[], roundTimesLeft: number[], roundExpired: boolean[], pausedFlags: boolean[], roundSecondsTotal: number, updatedAt: string[], now: number): RoundPoolReconcileResult`

- `poolTimes` — per-seat remaining pool-time in seconds (can go negative,
  meaning the pool is overdrawn).
- `roundTimesLeft` — per-seat remaining round-time in seconds.
- `roundExpired` — per-seat flag for whether that seat's round timer has
  already hit zero.
- `pausedFlags` — per-seat flag; paused seats are skipped entirely (not
  fast-forwarded).
- `roundSecondsTotal` — the table's configured round-timer length in
  seconds (`0` means round timers are disabled for this table).
- `updatedAt` — per-seat ISO timestamp of that seat's last save, the
  anchor each seat fast-forwards from.
- `now` — current time in epoch ms.
- Returns a `RoundPoolReconcileResult` with the recomputed `poolTimes`,
  `roundTimesLeft`, and `roundExpired` arrays.

For every unpaused seat, fast-forwards round time and pool time by the real
time elapsed since that seat's **own** last-saved moment (`updatedAt[i]`) —
saves only happen on press/pause/reset, not on every tick. Elapsed seconds
are consumed from round time first (while `roundSecondsTotal > 0` and the
round hasn't already expired), then any remainder spills onto the pool —
mirroring exactly what `useTimerState`'s per-second tick loop would have
done. `updatedAt` is deliberately an array (one timestamp per seat, not a
single shared value): since the split into per-seat
[`TimerSeat`](models/timer-seat.md) documents, a seat that hasn't been
touched for a while fast-forwards from its **own** last-saved moment rather
than borrowing whichever seat at the table happened to be updated most
recently. Used both by the interactive timer (on reconnect) and the
read-only results dashboard, so pool time never appears to drain during a
seat's round-time phase.

### `resolveEffectiveTimer(timer: Pick<Timer, "hasCustomTimer" | "durationMinutesTotal" | "roundSecondsTotal" | "direction"> | undefined, gameSettings: { durationMinutesTotal?: number; roundSecondsTotal?: number; direction?: Timer["direction"] } | undefined): EffectiveTimerSettings`

- `timer` — the table's own `Timer` document fields (or `undefined` if the
  table has none yet).
- `gameSettings` — the parent game's default timer settings, used as the
  fallback when the table isn't customized.
- Returns an `EffectiveTimerSettings` describing which settings actually
  apply.

Determines the timer settings that actually apply to a table: a deliberate
per-table override, or otherwise the game's default settings.
`hasCustomTimer` is the authoritative signal for whether the table was
customized at all — `durationMinutesTotal`/`roundSecondsTotal` are Appwrite
number fields that default to `0` when never explicitly set, which would be
indistinguishable from a deliberately-chosen `0` (e.g. round timer disabled
on purpose). Timer documents saved before `hasCustomTimer` existed have the
field as `undefined` but may still carry a genuine custom duration from
back then — inferred from that instead (`durationMinutesTotal` present), so
the override isn't lost on rollout. A table explicitly reverted via "use
default timer" has `hasCustomTimer === false` set deliberately, which must
NOT fall into that legacy inference (hence the check via `=== undefined`,
not just falsy). Shared by the live timer and the read-only results
dashboard so the two can't drift apart.

## Used by

[`useTimerState.ts`](hooks/useTimerState.md),
[`ResultsAdminTab.tsx`](components/results/ResultsAdminTab.md),
[`ScoreSignatureModal.tsx`](components/results/ScoreSignatureModal.md),
[`SignatureSlot.tsx`](components/results/SignatureSlot.md),
[`TableCard.tsx`](components/results/TableCard.md),
[`ActiveScheduleCard.tsx`](components/schedule/ActiveScheduleCard.md),
[`Schedule.tsx`](components/schedule/Schedule.md),
[`TimerCell.tsx`](components/timer/TimerCell.md),
[`RankingsTab.tsx`](components/admin/RankingsTab.md),
[`lib/import/*`](import/README.md) (player-, table-import-service, wipe-service),
[`lib/stores/appwrite/timer-seat-store.ts`](stores/appwrite/timer-seat-store.md),
[`lib/stores/appwrite/timer-store.ts`](stores/appwrite/timer-store.md),
[`lib/utils/statistics.ts`](utils/statistics.md),
and the screens [`active-bells.tsx`](../app/(pages)/(admin)/active-bells.md),
[`game.tsx`](../app/(pages)/(user)/game.md),
[`results.tsx`](../app/(pages)/(user)/results.md),
[`timer.tsx`](../app/(pages)/(user)/timer.md).
