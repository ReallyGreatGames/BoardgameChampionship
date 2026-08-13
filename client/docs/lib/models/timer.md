# `lib/models/timer.ts`

[← lib/models](README.md)

## Purpose

Defines the Appwrite document type `Timer`: the **table-wide** timer
settings and bookkeeping for a (table, game) pair — one document per
combination.

## Exports

### `type Timer`

| Field | Type | Meaning |
|---|---|---|
| `table` | `number` | Table number |
| `games` | `string \| null` | Game id (Appwrite relation) |
| `durationMinutesTotal?` | `number` | Total timer duration in minutes |
| `roundSecondsTotal?` | `number` | Per-seat time budget for the current round/turn, in seconds. `0` or absent disables the round-timer feature entirely (only the pool timer applies) |
| `direction?` | `"up" \| "down"` | Display direction of the timer |
| `hasCustomTimer?` | `boolean` | See below |
| `tableActiveAccumulatedMs?` | `number` | See below |
| `tableActiveResumedAt?` | `string \| null` | See below |
| `playerPositions` | `Player[]` | Seating order of the players |

**`hasCustomTimer`**: explicitly set once a per-table custom timer has been
saved (and cleared once reverted via "use default timer"). This is the
authoritative signal for whether `durationMinutesTotal`/`roundSecondsTotal`/
`direction` on this doc are a deliberate override. Needed because those
fields are numbers Appwrite fills with a schema default of `0` when never
explicitly set — indistinguishable from a deliberately-chosen `0` (e.g.
round timer disabled on purpose) without a separate flag. Also protects
tables with a pre-existing custom *duration* only (saved before
`roundSecondsTotal` existed) from having their round timer silently
disabled by that same `0` default.

**`tableActiveAccumulatedMs`**: total milliseconds the table has had at
least one seat running, excluding the current still-running stretch (see
`tableActiveResumedAt`) — folded in whenever the last running seat pauses.
Reset to 0 alongside a timer reset/custom-timer save, same as every other
per-session field.

**`tableActiveResumedAt`**: ISO timestamp of when the table last went from
"everyone paused" to "at least one seat running", or `null` while
everyone's paused. The table's total elapsed time is derived (not stored as
a live-ticking counter): `tableActiveAccumulatedMs` plus, while this is
non-null, wall-clock time since this timestamp — every device computes it
locally each second rather than the doc being written every tick.

### `function timerRowId(table: number, gameId: string | null): string`

Builds a deterministic document id (`timer-{table}-{gameId ?? "none"}`).
Two devices racing to create the first `Timer` doc for the same (table,
game) pair collide at the database layer instead of each silently creating
its own document — see [timer-store.ts](../stores/appwrite/timer-store.md).

## Used by

- [`lib/hooks/useTimerState.ts`](../hooks/useTimerState.md) — the entire timer logic
- [`lib/stores/appwrite/timer-store.ts`](../stores/appwrite/timer-store.md) — CRUD/realtime store for `Timer` documents
- [`lib/components/results/types.ts`](../components/results/types.md)
- [`lib/utils.ts`](../utils.md) — e.g. `resolveEffectiveTimer`, `resolveGameId`

## Related

- [`lib/models/timer-seat.ts`](timer-seat.md) — the per-seat counterparts that used to be part of this document
- [`lib/models/player.ts`](player.md) — type of `playerPositions`
