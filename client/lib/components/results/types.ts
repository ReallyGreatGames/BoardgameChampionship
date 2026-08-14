import { Player } from "@/lib/models/player";
import type { Result } from "@/lib/models/result";
import type { TableBell } from "@/lib/models/table-bell";
import type { Timer } from "@/lib/models/timer";
import type { TimerSeat } from "@/lib/models/timer-seat";

export type TableEntry = {
  id: number;
  players: Player[];
  timer: Timer | undefined;
  seats: TimerSeat[];
  result: Result | undefined;
  bell: TableBell | undefined;
  hasBell: boolean;
  bellAcknowledged: boolean;
  isRunning: boolean;
  isSubmitted: boolean;
  hasNote: boolean;
  timerDirection: "up" | "down";
  timerTotalSeconds: number;
  timerRoundSecondsTotal: number;
};
