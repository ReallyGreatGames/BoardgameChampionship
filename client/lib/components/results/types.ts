import { Player } from "@/lib/models/player";
import type { Result } from "@/lib/models/result";
import type { TableBell } from "@/lib/models/table-bell";
import type { Timer } from "@/lib/models/timer";
import type { TimerSeat } from "@/lib/models/timer-seat";

export type TableEntry = {
  id: number;
  players: Player[];
  /** Table-wide timer settings/bookkeeping only — per-seat running state
   *  lives in `seats` (see lib/models/timer-seat.ts). */
  timer: Timer | undefined;
  /** This table's seat documents, sparse — a seat with no document yet
   *  simply hasn't been touched (see TableCard.tsx's per-seat fallbacks). */
  seats: TimerSeat[];
  result: Result | undefined;
  bell: TableBell | undefined;
  hasBell: boolean;
  bellAcknowledged: boolean;
  isRunning: boolean;
  isSubmitted: boolean;
  hasNote: boolean;
  /** Effective timer direction, resolved from the timer doc or the game's timer settings. */
  timerDirection: "up" | "down";
  /** Effective per-player total seconds, resolved from the timer doc or the game's timer settings. */
  timerTotalSeconds: number;
  /** Effective per-player round-time budget in seconds, resolved from the
   *  timer doc or the game's timer settings — 0 disables round-time
   *  accounting, so pool time reconciliation ticks from the start. */
  timerRoundSecondsTotal: number;
};
