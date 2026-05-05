import { ID, Query } from "react-native-appwrite";
import { DATABASE_ID, tablesDB } from "../appwrite";
import { withRetry } from "../utils";
import { ParsedTeam } from "./tsv-parser";

const TEAMS_TABLE = "teams";
const PLAYERS_TABLE = "players";

export type ImportRowStatus =
  | { state: "pending" }
  | { state: "importing" }
  | { state: "success" }
  | { state: "error"; message: string };

type ExistingTeam = { $id: string; code: string };
type ExistingPlayer = { $id: string; team: string | { $id: string }; playerNumber: number };

interface AppwriteError {
  code?: number;
  message?: string;
}

function isRateLimit(e: unknown): boolean {
  const err = e as AppwriteError;
  return err?.code === 429 || err?.message?.toLowerCase().includes("rate limit") === true;
}

function retry<T>(fn: () => Promise<T>): Promise<T> {
  return withRetry(fn, { shouldRetry: isRateLimit });
}

export async function prefetchExisting(): Promise<{
  teamsByCode: Map<string, ExistingTeam>;
  playersByTeamAndNumber: Map<string, Map<number, string>>;
}> {
  const [teamsResult, playersResult] = await Promise.all([
    retry(() => tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: TEAMS_TABLE,
      queries: [Query.limit(500)],
    })),
    retry(() => tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: PLAYERS_TABLE,
      queries: [Query.limit(500)],
    })),
  ]);

  const teamsByCode = new Map<string, ExistingTeam>(
    (teamsResult.rows as unknown as ExistingTeam[]).map((t) => [t.code, t]),
  );

  const playersByTeamAndNumber = new Map<string, Map<number, string>>();
  for (const p of playersResult.rows as unknown as ExistingPlayer[]) {
    const teamId = typeof p.team === "object" ? p.team.$id : p.team;
    if (!playersByTeamAndNumber.has(teamId)) {
      playersByTeamAndNumber.set(teamId, new Map());
    }
    playersByTeamAndNumber.get(teamId)!.set(p.playerNumber, p.$id);
  }

  return { teamsByCode, playersByTeamAndNumber };
}

export async function importTeam(
  parsed: ParsedTeam,
  teamsByCode: Map<string, ExistingTeam>,
  playersByTeamAndNumber: Map<string, Map<number, string>>,
  onStatus: (status: ImportRowStatus) => void,
): Promise<void> {
  onStatus({ state: "importing" });

  try {
    const existingTeam = teamsByCode.get(parsed.code);
    let teamId: string;

    if (existingTeam) {
      teamId = existingTeam.$id;
      await retry(() => tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: TEAMS_TABLE,
        rowId: teamId,
        data: { name: parsed.name, country: parsed.country },
      }));
    } else {
      const doc = await retry(() => tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: TEAMS_TABLE,
        rowId: ID.unique(),
        data: { name: parsed.name, code: parsed.code, country: parsed.country },
      }));
      teamId = doc.$id;
    }

    const existingPlayerNumbers = playersByTeamAndNumber.get(teamId) ?? new Map<number, string>();

    for (const player of parsed.players) {
      const existingPlayerId = existingPlayerNumbers.get(player.playerNumber);
      const playerCode = `${parsed.code}-${player.playerNumber}`;
      if (existingPlayerId) {
        await retry(() => tablesDB.updateRow({
          databaseId: DATABASE_ID,
          tableId: PLAYERS_TABLE,
          rowId: existingPlayerId,
          data: { name: player.name, playerCode },
        }));
      } else {
        await retry(() => tablesDB.createRow({
          databaseId: DATABASE_ID,
          tableId: PLAYERS_TABLE,
          rowId: ID.unique(),
          data: { name: player.name, team: teamId, playerNumber: player.playerNumber, playerCode },
        }));
      }
    }

    onStatus({ state: "success" });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : (e as AppwriteError)?.message ?? "Unknown error";
    onStatus({ state: "error", message });
  }
}
