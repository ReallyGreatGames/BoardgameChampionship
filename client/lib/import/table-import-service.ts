import { ID, Query } from "react-native-appwrite";
import { DATABASE_ID, tablesDB } from "../appwrite";
import { sleep, withRetry } from "../utils";
import { ParsedTableGroup } from "./table-parser";

const TABLES_COLLECTION = "tables";
const PLAYERS_TABLE = "players";
const SCHEDULE_TABLE = "schedule";

export type ImportRowStatus =
  | { state: "pending" }
  | { state: "importing" }
  | { state: "success" }
  | { state: "error"; message: string };

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

function retry<T>(fn: () => Promise<T>): Promise<T> {
  return withRetry(fn, { shouldRetry: isRateLimit });
}

type RawScheduleEntry = {
  $id: string;
  gameId?: string;
  sortIndex: number;
  title: string;
};
type RawPlayer = { $id: string; playerCode: string };

export type ValidatedEntry = {
  line: number;
  tableNumber: number;
  playerCodes: string[];
  errors: string[];
};

export type ValidatedGroup = {
  gameIndex: number;
  gameTitle: string;
  gameId: string;
  entries: ValidatedEntry[];
};

export type FetchAndValidateResult = {
  groups: ValidatedGroup[];
  globalErrors: string[];
  playersByCode: Map<string, string>;
  hasErrors: boolean;
};

export async function fetchAndValidate(
  parsedGroups: ParsedTableGroup[],
): Promise<FetchAndValidateResult> {
  const [scheduleResult, playersResult] = await Promise.all([
    retry(() =>
      tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: SCHEDULE_TABLE,
        queries: [Query.limit(500)],
      }),
    ),
    retry(() =>
      tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: PLAYERS_TABLE,
        queries: [Query.limit(500)],
      }),
    ),
  ]);

  const scheduleEntries = (scheduleResult.rows as unknown as RawScheduleEntry[])
    .filter((s) => s.gameId)
    .sort((a, b) => a.sortIndex - b.sortIndex);

  const playersByCode = new Map<string, string>(
    (playersResult.rows as unknown as RawPlayer[]).map((p) => [
      p.playerCode,
      p.$id,
    ]),
  );

  const globalErrors: string[] = [];

  if (parsedGroups.length !== scheduleEntries.length) {
    globalErrors.push(
      `File has ${parsedGroups.length} game group(s) but schedule has ${scheduleEntries.length} game(s) with a game ID`,
    );
  }

  const groups: ValidatedGroup[] = parsedGroups.map((group, i) => {
    const scheduleEntry = scheduleEntries[i];
    const entries: ValidatedEntry[] = group.entries.map((entry) => {
      const errors = entry.error ? [entry.error] : [];
      for (const code of entry.playerCodes) {
        if (!playersByCode.has(code)) {
          errors.push(`Unknown player code: ${code}`);
        }
      }
      return {
        line: entry.line,
        tableNumber: entry.tableNumber,
        playerCodes: entry.playerCodes,
        errors,
      };
    });

    return {
      gameIndex: i,
      gameTitle: scheduleEntry?.title ?? `Game ${i + 1}`,
      gameId: scheduleEntry?.gameId ?? "",
      entries,
    };
  });

  const hasEntryErrors = groups.some((g) =>
    g.entries.some((e) => e.errors.length > 0),
  );
  const hasErrors = globalErrors.length > 0 || hasEntryErrors;

  return { groups, globalErrors, playersByCode, hasErrors };
}

export async function importTables(
  groups: ValidatedGroup[],
  playersByCode: Map<string, string>,
  onStatus: (
    groupIndex: number,
    entryIndex: number,
    status: ImportRowStatus,
  ) => void,
): Promise<void> {
  const existing = await retry(() =>
    tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: TABLES_COLLECTION,
      queries: [Query.limit(500)],
    }),
  );

  for (const row of existing.rows) {
    await retry(() =>
      tablesDB.deleteRow({
        databaseId: DATABASE_ID,
        tableId: TABLES_COLLECTION,
        rowId: (row as { $id: string }).$id,
      }),
    );
  }

  for (let g = 0; g < groups.length; g++) {
    const group = groups[g];
    for (let e = 0; e < group.entries.length; e++) {
      const entry = group.entries[e];
      onStatus(g, e, { state: "importing" });
      try {
        const playerIds = entry.playerCodes.map(
          (code) => playersByCode.get(code)!,
        );
        await retry(() =>
          tablesDB.createRow({
            databaseId: DATABASE_ID,
            tableId: TABLES_COLLECTION,
            rowId: ID.unique(),
            data: {
              tableNumber: entry.tableNumber,
              game: group.gameId,
              players: playerIds,
            },
          }),
        );
        onStatus(g, e, { state: "success" });
        await sleep(300);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : ((err as AppwriteError)?.message ?? "Unknown error");
        onStatus(g, e, { state: "error", message });
      }
    }
  }
}
