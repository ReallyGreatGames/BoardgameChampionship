import { router, useLocalSearchParams } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { usePlayer } from "../../../lib/bootstrap/PlayerProvider";
import { PlayerPickerForm } from "../../../lib/components/PlayerPickerForm";
import { Player } from "@/lib/models/player";

export default function ChooseYourCharacter() {
  const { assignPlayer, player } = usePlayer();
  const { from, gameId } = useLocalSearchParams<{
    from?: string;
    gameId?: string;
  }>();
  const drawerEnabled = player !== null;

  async function handleConfirm(player: Player) {
    await assignPlayer(player);
    if (gameId) {
      router.replace({ pathname: "/game", params: { gameId } });
    } else if (from) {
      router.push("/settings");
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(pages)/(user)/schedule");
    }
  }

  return (
    <>
      <Drawer.Screen
        options={{
          swipeEnabled: drawerEnabled,
          headerLeft: drawerEnabled ? undefined : () => null,
        }}
      />
      <PlayerPickerForm
        onConfirm={handleConfirm}
        onBack={from ? () => router.back() : undefined}
      />
    </>
  );
}
