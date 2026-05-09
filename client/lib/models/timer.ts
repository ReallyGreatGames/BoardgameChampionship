import { Models } from "react-native-appwrite";
import { Player } from "./player";

export type Timer = {
  playerTimes: number[];
  table: number;
  games: string | null;
  activePlayerTimer: number | null;
  paused?: boolean;
  durationMinutesTotal?: number;
  direction?: "up" | "down";
  playersInOvertime?: boolean[];
  playerPositions: Player[];
} & Models.Document;
