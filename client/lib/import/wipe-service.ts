import { Models, Query } from "react-native-appwrite";
import { DATABASE_ID, LOTTERY_BUCKET_ID, storage, tablesDB } from "../appwrite";
import { sleep, withRetry, WRITE_PACING_MS } from "../utils";

const PAGE_SIZE = 500;

export type WipeItemStatus =
  | { state: "pending" }
  | { state: "deleting" }
  | { state: "success" }
  | { state: "error"; message: string };

export type WipeItem = {
  id: string;
  label: string;
};

export type WipeItemKind = "row" | "file";

export type WipeGroup = {
  key: string;
  label: string;
  tableId: string;
  kind?: WipeItemKind;
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
  kind: WipeItemKind = "row",
): Promise<void> {
  for (const item of items) {
    if (!isMounted()) {
      return;
    }
    onStatus(item.id, { state: "deleting" });
    try {
      await retry(() =>
        kind === "file"
          ? storage.deleteFile({ bucketId: tableId, fileId: item.id })
          : tablesDB.deleteRow({ databaseId: DATABASE_ID, tableId, rowId: item.id }),
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
    await sleep(WRITE_PACING_MS);
  }
}

type RawTeam = { name: string };
type RawTable = { tableNumber: number };
type RawTimer = { table: number };
type RawTimerSeat = { table: number; seat: number };
type RawOptionsLottery = { name: string };

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

function timerSeatGroup(seats: (RawTimerSeat & { $id: string })[]): WipeGroup {
  return {
    key: "timerSeats",
    label: "Timer seatings",
    tableId: "timer_seats",
    items: seats.map((s) => ({
      id: s.$id,
      label: `Timer Seat (Table ${s.table}, Seat ${s.seat})`,
    })),
  };
}

async function listAllLotteryFiles(): Promise<Models.File[]> {
  const files: Models.File[] = [];
  let offset = 0;

  for (;;) {
    const page = await retry(() =>
      storage.listFiles({
        bucketId: LOTTERY_BUCKET_ID,
        queries: [Query.limit(PAGE_SIZE), Query.offset(offset)],
      }),
    );
    files.push(...page.files);
    if (page.files.length < PAGE_SIZE) {
      break;
    }
    offset += PAGE_SIZE;
  }

  return files;
}

function lotteryPhotosGroup(files: Models.File[]): WipeGroup {
  return {
    key: "lotteryPhotos",
    label: "Lottery photos",
    tableId: LOTTERY_BUCKET_ID,
    kind: "file",
    items: files.map((f) => ({ id: f.$id, label: f.name })),
  };
}

function lotteryOptionsGroup(rows: (RawOptionsLottery & { $id: string })[]): WipeGroup {
  return {
    key: "lotteryOptions",
    label: "Lottery options",
    tableId: "options-lotteries",
    items: rows.map((r) => ({ id: r.$id, label: r.name })),
  };
}

export async function listPlayersWipePlan(): Promise<WipeGroup[]> {
  const [teams, tables, timers, timerSeats, lotteryFiles, lotteryOptions] = await Promise.all([
    listAllRows<RawTeam>("teams"),
    listAllRows<RawTable>("tables"),
    listAllRows<RawTimer>("timers"),
    listAllRows<RawTimerSeat>("timer_seats"),
    listAllLotteryFiles(),
    listAllRows<RawOptionsLottery>("options-lotteries"),
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
    timerSeatGroup(timerSeats),
    lotteryPhotosGroup(lotteryFiles),
    lotteryOptionsGroup(lotteryOptions),
  ];
}

export async function listTablesWipePlan(): Promise<WipeGroup[]> {
  const [tables, timers, timerSeats, lotteryFiles, lotteryOptions] = await Promise.all([
    listAllRows<RawTable>("tables"),
    listAllRows<RawTimer>("timers"),
    listAllRows<RawTimerSeat>("timer_seats"),
    listAllLotteryFiles(),
    listAllRows<RawOptionsLottery>("options-lotteries"),
  ]);

  return [
    tableGroup(tables),
    timerGroup(timers),
    timerSeatGroup(timerSeats),
    lotteryPhotosGroup(lotteryFiles),
    lotteryOptionsGroup(lotteryOptions),
  ];
}
