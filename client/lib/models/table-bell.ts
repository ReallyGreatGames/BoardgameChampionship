import { Models } from "react-native-appwrite";

export type TableBell = {
  table: number;
  startTime: string;
  acknowledgeTime?: string;
  locked?: boolean;
  reason?: string;
} & Models.Document;

export function bellRowId(table: number): string {
  return `bell-${table}`;
}
