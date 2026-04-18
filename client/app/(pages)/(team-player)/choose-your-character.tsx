import { router, useLocalSearchParams } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { Team, usePlayer } from "../../../lib/bootstrap/PlayerProvider";
import { PlayerPickerForm } from "../../../lib/components/PlayerPickerForm";

export default function ChooseYourCharacter() {
  const { assignPlayer, player } = usePlayer();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const drawerEnabled = player !== null;

  async function handleConfirm(team: Team, playerId: string) {
    await assignPlayer({ team, playerId });
    if (from) {
      router.push("/settings");
    } else {
      router.push("/");
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
