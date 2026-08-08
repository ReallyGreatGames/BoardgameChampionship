import { Models } from "react-native-appwrite";

export type Game = {
  durationMinutesTotal: number;
  /** Default per-seat round/turn time budget, in seconds. 0 disables the
   *  round-timer feature for tables using this game's default settings. */
  roundSecondsTotal: number;
  direction: "up" | "down";
  colors: string[];
} & Models.Row & Models.Document;