import { usePlayer } from "../bootstrap/PlayerProvider";
import { useTableStore } from "../stores/appwrite/table-store";
import { resolveGameId } from "@/lib/utils";

export function usePlayerTable(
  gameId: string | null | undefined,
): number | null {
  const { player: currentPlayer } = usePlayer();
  const tableCollection = useTableStore((s) => s.collection);

  if (!gameId || !currentPlayer) {
    return null;
  }
  const found = tableCollection.find((t) => {
    const tGameId = resolveGameId(t.game);
    return (
      tGameId === gameId &&
      t.players?.some((p) => p.$id === currentPlayer.$id)
    );
  });
  return found?.tableNumber ?? null;
}
