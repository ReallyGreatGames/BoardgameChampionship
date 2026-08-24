import { ID, Query } from "react-native-appwrite";
import { DATABASE_ID, tablesDB } from "../appwrite";
import { Rule, RuleType } from "../models/rule";
import { sleep, withRetry, WRITE_PACING_MS } from "../utils";
import { ParsedRule } from "./rule-parser";

const RULES_TABLE = "rules";

export type ImportRowStatus =
  | { state: "pending" }
  | { state: "importing" }
  | { state: "success" }
  | { state: "error"; message: string };

export type RuleImportAction = "create" | "update" | "unchanged";

export type RuleImportRow = ParsedRule & {
  action: RuleImportAction;
  existingId?: string;
  previousText?: string;
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

function retry<T>(fn: () => Promise<T>): Promise<T> {
  return withRetry(fn, { shouldRetry: isRateLimit });
}

export async function fetchExistingRulesForGame(gameId: string): Promise<Rule[]> {
  const result = await retry(() =>
    tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: RULES_TABLE,
      queries: [Query.equal("gameId", gameId), Query.limit(500)],
    }),
  );
  return result.rows as unknown as Rule[];
}

export function matchExisting(
  parsed: ParsedRule[],
  existingRules: Rule[],
  gameId: string,
): RuleImportRow[] {
  const existingByTitle = new Map(
    existingRules
      .filter((r) => r.gameId === gameId)
      .map((r) => [r.title.trim().toLowerCase(), r]),
  );

  return parsed.map((entry) => {
    const existing = existingByTitle.get(entry.title.trim().toLowerCase());
    if (!existing) {
      return { ...entry, action: "create" };
    }
    if (existing.type === entry.type && existing.text.trim() === entry.text.trim()) {
      return {
        ...entry,
        action: "unchanged",
        existingId: existing.$id,
        previousText: existing.text,
      };
    }
    return {
      ...entry,
      action: "update",
      existingId: existing.$id,
      previousText: existing.text,
    };
  });
}

export async function deleteAllRules(
  rulesToDelete: Rule[],
  onStatus: (index: number, status: ImportRowStatus) => void,
  isMounted: () => boolean = () => true,
): Promise<void> {
  for (let i = 0; i < rulesToDelete.length; i++) {
    if (!isMounted()) {
      return;
    }
    onStatus(i, { state: "importing" });
    try {
      await retry(() =>
        tablesDB.deleteRow({
          databaseId: DATABASE_ID,
          tableId: RULES_TABLE,
          rowId: rulesToDelete[i].$id,
        }),
      );
      onStatus(i, { state: "success" });
      await sleep(WRITE_PACING_MS);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : ((err as AppwriteError)?.message ?? "Unknown error");
      onStatus(i, { state: "error", message });
    }
  }
}

export async function importRules(
  rows: RuleImportRow[],
  gameId: string,
  onStatus: (index: number, status: ImportRowStatus) => void,
  isMounted: () => boolean = () => true,
): Promise<void> {
  for (let i = 0; i < rows.length; i++) {
    if (!isMounted()) {
      return;
    }
    const row = rows[i];

    if (row.action === "unchanged") {
      onStatus(i, { state: "success" });
      continue;
    }

    onStatus(i, { state: "importing" });
    try {
      if (row.action === "update" && row.existingId) {
        await retry(() =>
          tablesDB.updateRow({
            databaseId: DATABASE_ID,
            tableId: RULES_TABLE,
            rowId: row.existingId!,
            data: {
              type: row.type as RuleType,
              text: row.text,
              title: row.title,
            },
          }),
        );
      } else {
        await retry(() =>
          tablesDB.createRow({
            databaseId: DATABASE_ID,
            tableId: RULES_TABLE,
            rowId: ID.unique(),
            data: {
              gameId,
              type: row.type as RuleType,
              text: row.text,
              title: row.title,
            },
          }),
        );
      }
      onStatus(i, { state: "success" });
      await sleep(WRITE_PACING_MS);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : ((err as AppwriteError)?.message ?? "Unknown error");
      onStatus(i, { state: "error", message });
    }
  }
}
