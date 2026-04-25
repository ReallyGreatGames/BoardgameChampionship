import { Models } from "react-native-appwrite";

export type TimerSettings = {
  durationMinutesTotal: number;
  direction: "up" | "down";
} & Models.Document;
