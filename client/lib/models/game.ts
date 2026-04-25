import { Models } from "react-native-appwrite";

export type Game = {
  name: string;
  durationMinutesTotal: number;
  direction: "up" | "down";
} & Models.Document;
