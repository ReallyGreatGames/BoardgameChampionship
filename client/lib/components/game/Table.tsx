import { usePlayer } from "@/lib/bootstrap/PlayerProvider";
import { GameSeatingList } from "@/lib/components/game/GameSeatingList";
import { useTableStore } from "@/lib/stores/appwrite/table-store";
import { resolveGameId } from "@/lib/utils";

export function Table({
  gameId,
  showTableNumber = true,
}: {
  gameId: string;
  showTableNumber?: boolean;
}) {
  const { player: currentPlayer } = usePlayer();
  const collection = useTableStore((s) => s.collection);

  const table = collection.find((t) => {
    const tableGameId = resolveGameId(t.game);
    const gameMatches = tableGameId === gameId;
    const playerMatches =
      t.players?.some((p) => p.$id === currentPlayer?.$id) ?? false;
    return gameMatches && playerMatches;
  });

  return (
    <GameSeatingList
      table={table}
      tableNumber={showTableNumber ? table?.tableNumber : null}
    />
  );
}
