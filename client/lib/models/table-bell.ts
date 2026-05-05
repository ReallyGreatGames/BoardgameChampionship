import { Models } from "react-native-appwrite";

export type TableBell = {
  table: number;
  startTime: string;
  acknowledgeTime?: string;
  locked?: boolean;
  reason?: string;
} & Models.Document;
