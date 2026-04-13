import { router, useLocalSearchParams } from "expo-router";
import { Team, usePlayer } from "../../../lib/bootstrap/PlayerProvider";
import { PlayerPickerForm } from "../../../lib/components/PlayerPickerForm";

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
