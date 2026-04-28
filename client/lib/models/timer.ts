import { Models } from "react-native-appwrite";

export type Timer = {
  playerTimes: number[];
  table: number;
  games: string | null;
  activePlayerTimer: number | null;
  paused?: boolean;
  durationMinutesTotal?: number;
  direction?: "up" | "down";
} & Models.Document;
