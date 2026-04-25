import { Models } from "react-native-appwrite";

export type Timer = {
  playerTimes: number[];
  table: number;
  games: string | null;
} & Models.Document;
