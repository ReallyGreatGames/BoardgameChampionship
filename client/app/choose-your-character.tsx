import { router, useLocalSearchParams } from "expo-router";
import { PlayerPickerForm } from "../lib/components/PlayerPickerForm";
import { Team, usePlayer } from "../lib/bootstrap/PlayerProvider";

export default function ChooseYourCharacter() {
  const { assignPlayer } = usePlayer();
  const { from } = useLocalSearchParams<{ from?: string }>();

  async function handleConfirm(team: Team, playerId: string) {
    await assignPlayer({ team, playerId });
    router.back();
  }

  return (
    <PlayerPickerForm
      onConfirm={handleConfirm}
      onBack={from ? () => router.back() : undefined}
    />
  );
}
