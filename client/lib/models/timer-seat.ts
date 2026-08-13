import { Models } from "react-native-appwrite";

/** One player seat's timer state, one document per (table, game, seat) —
 *  split out of the old single per-table Timer document (which held these
 *  as four-entry arrays) so two seats can be written independently. That
 *  was the actual cause of the cross-device race: Appwrite has no
 *  index-level array merge, so any write to the old doc replaced ALL four
 *  seats at once, letting a slightly-stale write from one device silently
 *  undo a different device's change to an UNRELATED seat. With one row per
 *  seat, two devices touching different seats now touch different Appwrite
 *  rows — there's nothing left to clobber. See lib/models/timer.ts for the
 *  table-wide fields (duration, round-time budget, direction, table-elapsed
 *  bookkeeping) that stay shared across all four seats. */
export type TimerSeat = {
  table: number;
  games: string | null;
  /** 0-based seat index within the table (see PLAYER_COUNT in useTimerState.ts). */
  seat: number;
  /** Pool seconds remaining. Ticks down uniformly regardless of the table's
   *  configured direction — direction only changes how this is *displayed*
   *  (see TimerCell.tsx). Goes negative once exhausted; the magnitude is the
   *  overtime overage. */
  playerTime: number;
  paused: boolean;
  /** Whether this seat's pool has been fully used up. */
  inOvertime: boolean;
  /** Round-time seconds remaining — only ticks while `roundExpired` is false
   *  and the table's roundSecondsTotal > 0. */
  roundTimeLeft: number;
  /** Whether this seat's round-time phase has ended for the current round. */
  roundExpired: boolean;
  /** ISO timestamp of this seat's last pause, used to grant a short grace
   *  window (see ROUND_RESET_GRACE_MS in useTimerState.ts) so a quick
   *  pause/unpause doesn't reset the seat's round time. */
  roundLastPausedAt: string | null;
} & Models.Document;

/** Deterministic per-(table, game, seat) document id — same reasoning as
 *  `timerRowId` in timer.ts: two devices racing to create the same seat's
 *  first document converge on one row instead of each creating its own
 *  (see timer-seat-store.ts's `silentOnConflict`). */
export function timerSeatRowId(table: number, gameId: string | null, seat: number): string {
  return `timer-seat-${table}-${gameId ?? "none"}-${seat}`;
}
