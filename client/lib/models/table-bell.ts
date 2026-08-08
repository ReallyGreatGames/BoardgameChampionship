import { Models } from "react-native-appwrite";

export type TableBell = {
  table: number;
  startTime: string;
  acknowledgeTime?: string;
  locked?: boolean;
  reason?: string;
} & Models.Document;

/** Deterministic per-table document id. Only one active bell may exist per
 *  table at a time, so using a stable id instead of `ID.unique()` means two
 *  simultaneous ring attempts (two staff members, or two devices' auto-ring
 *  on timeout) collide at the database layer instead of each creating its
 *  own row — see table-bell-store.ts. */
export function bellRowId(table: number): string {
  return `bell-${table}`;
}
