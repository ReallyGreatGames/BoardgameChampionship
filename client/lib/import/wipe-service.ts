import { Query } from "react-native-appwrite";
import { DATABASE_ID, tablesDB } from "../appwrite";
import { sleep, withRetry } from "../utils";

const PAGE_SIZE = 500;
const DELETE_PACING_MS = 300;

export type WipeItemStatus =
  | { state: "pending" }
  | { state: "deleting" }
  | { state: "success" }
  | { state: "error"; message: string };

export type WipeItem = {
  id: string;
  label: string;
};

export type WipeGroup = {
  /** Stable key identifying this group, e.g. "teams" */
  key: string;
  /** Human-readable label for the progress UI, e.g. "Teams" */
  label: string;
  /** Appwrite table (collection) ID the items belong to */
  tableId: string;
  items: WipeItem[];
};

interface AppwriteError {
  code?: number;
  message?: string;
}

function isRateLimit(e: unknown): boolean {
  const err = e as AppwriteError;
  return (
    err?.code === 429 ||
    err?.message?.toLowerCase().includes("rate limit") === true
  );
}

function isNotFound(e: unknown): boolean {
  const err = e as AppwriteError;
  return (
    err?.code === 404 ||
    err?.message?.toLowerCase().includes("could not be found") === true
  );
}

function retry<T>(fn: () => Promise<T>): Promise<T> {
  return withRetry(fn, { shouldRetry: isRateLimit });
}

/** Fetches every row in a table, paging past Appwrite's per-request row limit. */
export async function listAllRows<T>(
  tableId: string,
): Promise<(T & { $id: string })[]> {
  const rows: (T & { $id: string })[] = [];
  let offset = 0;

  for (;;) {
    const page = await retry(() =>
      tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId,
        queries: [Query.limit(PAGE_SIZE), Query.offset(offset)],
      }),
    );
    rows.push(...(page.rows as unknown as (T & { $id: string })[]));
    if (page.rows.length < PAGE_SIZE) {
      break;
    }
    offset += PAGE_SIZE;
  }

  return rows;
}

/**
 * Deletes each item one at a time, reporting status per item via onStatus.
 * Keeps going past individual failures so the whole group's failures can be
 * retried together afterward, instead of aborting the entire wipe on the
 * first error.
 *
 * A "row not found" error is treated as success, not failure: some rows
 * (e.g. players) are cascade-deleted by Appwrite when their parent row
 * (e.g. their team) is removed first, so by the time we get to them
 * explicitly they're already gone — which is exactly the outcome we wanted.
 */
export async function deleteItems(
  tableId: string,
  items: WipeItem[],
  onStatus: (itemId: string, status: WipeItemStatus) => void,
  isMounted: () => boolean,
): Promise<void> {
  for (const item of items) {
    if (!isMounted()) {
      return;
    }
    onStatus(item.id, { state: "deleting" });
    try {
      await retry(() =>
        tablesDB.deleteRow({ databaseId: DATABASE_ID, tableId, rowId: item.id }),
      );
      onStatus(item.id, { state: "success" });
    } catch (e: unknown) {
      if (isNotFound(e)) {
        onStatus(item.id, { state: "success" });
      } else {
        const message =
          e instanceof Error
            ? e.message
            : ((e as AppwriteError)?.message ?? "Unknown error");
        onStatus(item.id, { state: "error", message });
      }
    }
    await sleep(DELETE_PACING_MS);
  }
}

type RawTeam = { name: string };
type RawTable = { tableNumber: number };
type RawTimer = { table: number };

function tableGroup(tables: (RawTable & { $id: string })[]): WipeGroup {
  return {
    key: "tables",
    label: "Table seatings",
    tableId: "tables",
    items: tables.map((t) => ({ id: t.$id, label: `Table ${t.tableNumber}` })),
  };
}

function timerGroup(timers: (RawTimer & { $id: string })[]): WipeGroup {
  return {
    key: "timers",
    label: "Timers",
    tableId: "timers",
    items: timers.map((t) => ({ id: t.$id, label: `Timer (Table ${t.table})` })),
  };
}

/**
 * Everything that must be cleared before re-importing teams & players:
 * the teams themselves (deleting a team cascade-deletes its players via
 * Appwrite's relationship attribute, so players never need to be deleted
 * explicitly), plus every table seating and timer that could reference
 * their (about to be invalidated) row ids.
 */
export async function listPlayersWipePlan(): Promise<WipeGroup[]> {
  const [teams, tables, timers] = await Promise.all([
    listAllRows<RawTeam>("teams"),
    listAllRows<RawTable>("tables"),
    listAllRows<RawTimer>("timers"),
  ]);

  return [
    {
      key: "teams",
      label: "Teams & players",
      tableId: "teams",
      items: teams.map((t) => ({ id: t.$id, label: t.name })),
    },
    tableGroup(tables),
    timerGroup(timers),
  ];
}

/**
 * Everything that must be cleared before re-importing table seatings: the
 * seatings themselves, plus every timer (a reseat can put a different set of
 * players at a table an existing timer already refers to).
 */
export async function listTablesWipePlan(): Promise<WipeGroup[]> {
  const [tables, timers] = await Promise.all([
    listAllRows<RawTable>("tables"),
    listAllRows<RawTimer>("timers"),
  ]);

  return [tableGroup(tables), timerGroup(timers)];
}
