import { Models } from "react-native-appwrite";
import { Player } from "./player";

export type Timer = {
  playerTimes: number[];
  table: number;
  games: string | null;
  /** Per-seat pause flag — replaces the old single `activePlayerTimer`/`paused`
   *  pair so multiple seats can run independently (Manual pause mode). */
  playersPaused: boolean[];
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
  /** Whether each seat's `durationMinutesTotal` pool has been fully used up. */
  playersInOvertime?: boolean[];
  /** Per-seat remaining round time, in seconds — only meaningful while the
   *  matching `roundExpired` entry is false. */
  roundTimesLeft?: number[];
  /** Whether each seat's round-time phase has already ended for the current round. */
  roundExpired?: boolean[];
  /** ISO timestamp of each seat's last pause, used to grant a short grace
   *  window (see ROUND_RESET_GRACE_MS) so a quick pause/unpause doesn't reset
   *  the seat's round time. */
  roundLastPausedAt?: (string | null)[];
  playerPositions: Player[];
} & Models.Document;

/** Deterministic per-(table, game) document id. Using a stable id instead of
 *  `ID.unique()` means two devices racing to create the first Timer doc for a
 *  table/game pair collide at the database layer instead of each silently
 *  creating its own document — see timer-store.ts. */
export function timerRowId(table: number, gameId: string | null): string {
  return `timer-${table}-${gameId ?? "none"}`;
}
