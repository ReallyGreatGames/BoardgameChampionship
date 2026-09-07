import { useMemo } from "react";
import { usePlayer } from "@/lib/bootstrap/PlayerProvider";
import { Player } from "@/lib/models/player";
import { Schedule } from "@/lib/models/schedule";
import { Table } from "@/lib/models/table";
import { useResultStore } from "@/lib/stores/appwrite/result-store";
import { useScheduleStore } from "@/lib/stores/appwrite/schedule-store";
import { useTableStore } from "@/lib/stores/appwrite/table-store";
import { resolveGameId } from "@/lib/utils";
import { computeTablePoints } from "@/lib/utils/placements";

export type ParticipantGameState = "played" | "playing" | "upcoming";

export type ParticipantOpponent = {
  id: string;
  name: string;
  teamName: string;
  country: string;
};

export type ParticipantGameEntry = {
  scheduleId: string;
  gameId: string;
  title: string;
  round: number;
  tableNumber: number | null;
  placement: number | null;
  points: number | null;
  state: ParticipantGameState;
};

export type ParticipantMatch = {
  item: Schedule;
  gameId: string;
  round: number;
  tableNumber: number | null;
  opponents: ParticipantOpponent[];
};

export type ParticipantOverview = {
  activeItem: Schedule | null;
  currentMatch: ParticipantMatch | null;
  entries: ParticipantGameEntry[];
  totalPoints: number;
  playedCount: number;
  totalCount: number;
};

const EMPTY_OVERVIEW: ParticipantOverview = {
  activeItem: null,
  currentMatch: null,
  entries: [],
  totalPoints: 0,
  playedCount: 0,
  totalCount: 0,
};

function teamOf(player: Player): { name: string; country: string } {
  const team = player.team;
  if (!team || typeof team === "string") {
    return { name: "", country: "" };
  }
  return { name: team.name ?? "", country: team.country ?? "" };
}

function findPlayerTable(
  tables: Table[],
  gameId: string,
  playerId: string,
): Table | null {
  return (
    tables.find(
      (table) =>
        resolveGameId(table.game) === gameId &&
        table.players?.some((p) => p.$id === playerId),
    ) ?? null
  );
}

export function useParticipantOverview(): ParticipantOverview {
  const { player } = usePlayer();
  const scheduleCollection = useScheduleStore((s) => s.collection);
  const tableCollection = useTableStore((s) => s.collection);
  const resultCollection = useResultStore((s) => s.collection);

  return useMemo<ParticipantOverview>(() => {
    if (!player) {
      return EMPTY_OVERVIEW;
    }

    const sortedItems = [...scheduleCollection].sort(
      (a, b) => a.sortIndex - b.sortIndex,
    );
    const activeItem = sortedItems.find((item) => item.isActive) ?? null;
    const gameItems = sortedItems.filter((item) => !!item.gameId);

    let totalPoints = 0;
    let playedCount = 0;

    const entries = gameItems.map<ParticipantGameEntry>((item, index) => {
      const gameId = item.gameId as string;
      const table = findPlayerTable(tableCollection, gameId, player.$id);
      const seat = table?.players?.findIndex((p) => p.$id === player.$id) ?? -1;
      const result = table
        ? resultCollection.find(
            (r) => r.gameId === gameId && r.table === table.tableNumber,
          )
        : undefined;

      const placements = result?.submitted ? result.placements ?? [] : [];
      const rawPlacement = seat >= 0 ? Number(placements[seat]) : NaN;
      const placement = Number.isFinite(rawPlacement) ? rawPlacement : null;
      const points =
        seat >= 0 && placement !== null
          ? computeTablePoints(placements)[seat] ?? null
          : null;

      if (points !== null) {
        totalPoints += points;
      }

      const played = points !== null || item.isFinished === true;
      if (played && !item.isActive) {
        playedCount += 1;
      }

      return {
        scheduleId: item.$id,
        gameId,
        title: item.title,
        round: index + 1,
        tableNumber: table?.tableNumber ?? null,
        placement,
        points,
        state: item.isActive ? "playing" : played ? "played" : "upcoming",
      };
    });

    const activeEntry = activeItem
      ? entries.find((entry) => entry.scheduleId === activeItem.$id)
      : undefined;

    const currentMatch: ParticipantMatch | null = activeEntry
      ? {
          item: activeItem as Schedule,
          gameId: activeEntry.gameId,
          round: activeEntry.round,
          tableNumber: activeEntry.tableNumber,
          opponents: (
            findPlayerTable(tableCollection, activeEntry.gameId, player.$id)
              ?.players ?? []
          )
            .filter((p) => p.$id !== player.$id)
            .map((p) => ({
              id: p.$id,
              name: p.name,
              teamName: teamOf(p).name,
              country: teamOf(p).country,
            })),
        }
      : null;

    return {
      activeItem,
      currentMatch,
      entries,
      totalPoints,
      playedCount,
      totalCount: entries.length,
    };
  }, [player, scheduleCollection, tableCollection, resultCollection]);
}
