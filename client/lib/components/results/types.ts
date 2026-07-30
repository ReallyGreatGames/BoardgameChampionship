import { Player } from "@/lib/models/player";
import type { Result } from "@/lib/models/result";
import type { TableBell } from "@/lib/models/table-bell";
import type { Timer } from "@/lib/models/timer";

export type TableEntry = {
  id: number;
  players: Player[];
  timer: Timer | undefined;
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
};
