import { router, useLocalSearchParams } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { Team, usePlayer } from "../../../lib/bootstrap/PlayerProvider";
import { PlayerPickerForm } from "../../../lib/components/PlayerPickerForm";

export default function ChooseYourCharacter() {
  const { assignPlayer, player } = usePlayer();
  const { from, gameId } = useLocalSearchParams<{ from?: string; gameId?: string }>();
  const drawerEnabled = player !== null;

  async function handleConfirm(team: Team, playerId: string) {
    await assignPlayer({ team, playerId });
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
