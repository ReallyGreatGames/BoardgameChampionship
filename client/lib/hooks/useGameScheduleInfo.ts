import { useMemo } from "react";
import { Schedule } from "@/lib/models/schedule";
import { useScheduleStore } from "@/lib/stores/appwrite/schedule-store";

export type GameScheduleInfo = {
  item: Schedule | null;
  title: string;
  round: number | null;
  isActive: boolean;
  isFinished: boolean;
};

const EMPTY_INFO: GameScheduleInfo = {
  item: null,
  title: "",
  round: null,
  isActive: false,
  isFinished: false,
};

export function useGameScheduleInfo(
  gameId: string | null | undefined,
): GameScheduleInfo {
  const collection = useScheduleStore((s) => s.collection);

  return useMemo<GameScheduleInfo>(() => {
    if (!gameId) {
      return EMPTY_INFO;
    }

    const gameItems = [...collection]
      .sort((a, b) => a.sortIndex - b.sortIndex)
      .filter((item) => !!item.gameId);

    const index = gameItems.findIndex((item) => item.gameId === gameId);
    if (index === -1) {
      return EMPTY_INFO;
    }

    const item = gameItems[index];
    return {
      item,
      title: item.title,
      round: index + 1,
      isActive: item.isActive === true,
      isFinished: item.isFinished === true,
    };
  }, [collection, gameId]);
}
