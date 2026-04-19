import { Models } from "react-native-appwrite";

export type TableBell = {
  table: number;
  startTime: string;
  acknowledgeTime?: string;
} & Models.Document;