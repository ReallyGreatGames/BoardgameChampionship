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
  key: string;
  label: string;
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

export async function listTablesWipePlan(): Promise<WipeGroup[]> {
  const [tables, timers] = await Promise.all([
    listAllRows<RawTable>("tables"),
    listAllRows<RawTimer>("timers"),
  ]);

  return [tableGroup(tables), timerGroup(timers)];
}
