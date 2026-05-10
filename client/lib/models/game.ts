import { Models } from "react-native-appwrite";

export type Game = {
  durationMinutesTotal: number;
  direction: "up" | "down";
  colors: string[];
} & Models.Row & Models.Document;