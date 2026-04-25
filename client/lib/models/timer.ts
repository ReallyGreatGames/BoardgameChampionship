import { Models } from "react-native-appwrite";

export type Timer = {
  playerTimes: number[];
  table: number;
  games: string | null;
  activePlayerTimer: number | null;
  paused?: boolean;
} & Models.Document;
