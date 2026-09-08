import { router } from "expo-router";
import { useCallback } from "react";
import { usePlayer } from "@/lib/bootstrap/PlayerProvider";
import { goTo } from "@/lib/utils/navigation";

const SCHEDULE_ROUTE = "/(pages)/(user)/schedule";

/**
 * Opens a game from the schedule. Players with a team/character go straight to
 * the game screen (with the schedule recorded as the origin, so its back button
 * returns here); everyone else is sent through character selection first.
 */
export function useOpenGame(): (gameId: string) => void {
  const { player } = usePlayer();

  return useCallback(
    (gameId: string) => {
      if (player?.team && player?.$id) {
        goTo(SCHEDULE_ROUTE, `/game?gameId=${gameId}&from=${SCHEDULE_ROUTE}`);
        return;
      }
      router.push({
        pathname: "/(pages)/(team-player)/choose-your-character",
        params: { gameId },
      });
    },
    [player],
  );
}
