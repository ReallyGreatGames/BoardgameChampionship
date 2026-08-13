import { Models } from "react-native-appwrite";

export type Game = {
  durationMinutesTotal: number;
  roundSecondsTotal: number;
  direction: "up" | "down";
  colors: string[];
} & Models.Row & Models.Document;