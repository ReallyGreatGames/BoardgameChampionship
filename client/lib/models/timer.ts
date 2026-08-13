import { Models } from "react-native-appwrite";
import { Player } from "./player";

/** Table-wide timer settings and bookkeeping, one document per (table,
 *  game). The four seats' own running state (pool/round time, pause flag,
 *  overtime) used to live here too, as four-entry arrays — moved out to
 *  lib/models/timer-seat.ts (one document per seat) so two seats can be
 *  written independently instead of every write replacing all four seats'
 *  data at once. What's left here is genuinely shared across the whole
 *  table, not per-seat. */
export type Timer = {
  table: number;
  games: string | null;
  durationMinutesTotal?: number;
  /** Per-seat time budget for the current round/turn, in seconds. 0 or absent
   *  disables the round-timer feature entirely (only the pool timer applies). */
  roundSecondsTotal?: number;
  direction?: "up" | "down";
  /** Explicitly set once a per-table custom timer has been saved (and cleared
   *  once reverted via "use default timer") — the authoritative signal for
   *  whether `durationMinutesTotal`/`roundSecondsTotal`/`direction` on this
   *  doc are a deliberate override. Needed because those fields are numbers
   *  Appwrite fills with a schema default of `0` when never explicitly set —
   *  indistinguishable from a deliberately-chosen `0` (e.g. round timer
   *  disabled on purpose) without a separate flag. Also protects tables with
   *  a pre-existing custom *duration* only (saved before `roundSecondsTotal`
   *  existed) from having their round timer silently disabled by that same
   *  `0` default. */
  hasCustomTimer?: boolean;
  /** Total milliseconds the table has had at least one seat running,
   *  excluding the current still-running stretch (see
   *  `tableActiveResumedAt`) — folded in whenever the last running seat
   *  pauses. Reset to 0 alongside a timer reset/custom-timer save, same as
   *  every other per-session field. */
  tableActiveAccumulatedMs?: number;
  /** ISO timestamp of when the table last went from "everyone paused" to
   *  "at least one seat running", or null while everyone's paused. The
   *  table's total elapsed time is derived (not stored as a live-ticking
   *  counter) as `tableActiveAccumulatedMs` plus, while this is non-null,
   *  wall-clock time since this timestamp — every device computes it
   *  locally each second rather than the doc being written every tick. */
  tableActiveResumedAt?: string | null;
  playerPositions: Player[];
} & Models.Document;

/** Deterministic per-(table, game) document id. Using a stable id instead of
 *  `ID.unique()` means two devices racing to create the first Timer doc for a
 *  table/game pair collide at the database layer instead of each silently
 *  creating its own document — see timer-store.ts. */
export function timerRowId(table: number, gameId: string | null): string {
  return `timer-${table}-${gameId ?? "none"}`;
}
