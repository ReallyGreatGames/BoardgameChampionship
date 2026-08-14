import { Models } from "react-native-appwrite";
import { Player } from "./player";

export type Timer = {
  table: number;
  games: string | null;
  durationMinutesTotal?: number;
  roundSecondsTotal?: number;
  direction?: "up" | "down";
  hasCustomTimer?: boolean;
  tableActiveAccumulatedMs?: number;
  tableActiveResumedAt?: string | null;
  playerPositions: Player[];
} & Models.Document;

export function timerRowId(table: number, gameId: string | null): string {
  return `timer-${table}-${gameId ?? "none"}`;
}
