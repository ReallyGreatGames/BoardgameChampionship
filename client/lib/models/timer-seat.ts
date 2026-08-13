import { Models } from "react-native-appwrite";

export type TimerSeat = {
  table: number;
  games: string | null;
  seat: number;
  playerTime: number;
  paused: boolean;
  inOvertime: boolean;
  roundTimeLeft: number;
  roundExpired: boolean;
  roundLastPausedAt: string | null;
} & Models.Document;

export function timerSeatRowId(table: number, gameId: string | null, seat: number): string {
  return `timer-seat-${table}-${gameId ?? "none"}-${seat}`;
}
