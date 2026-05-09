import { useMemo } from "react";
import { usePlayer } from "../bootstrap/PlayerProvider";
import { useTableStore } from "../stores/appwrite/table-store";

export function usePlayerTable(
  gameId: string | null | undefined,
): number | null {
  const { player: currentPlayer } = usePlayer();
  const tableCollection = useTableStore((s) => s.collection);

  return useMemo(() => {
    if (!gameId || !currentPlayer) {
      return null;
    }
    const found = tableCollection.find((t) => {
      const tGameId = typeof t.game === "string" ? t.game : t.game.$id;
      return (
        tGameId === gameId &&
        t.players?.some((p) => p.$id === currentPlayer.$id)
      );
    });
    return found?.tableNumber ?? null;
  }, [tableCollection, gameId, currentPlayer]);
}
