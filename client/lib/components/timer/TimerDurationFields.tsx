import { useMemo } from "react";
import { TextInput } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { makeSheetStyles } from "@/lib/components/ui/BottomSheet";
import { DirectionPicker } from "@/lib/components/ui/DirectionPicker";
import { FormField } from "@/lib/components/ui/FormField";

type Props = {
  duration: string;
  onDurationChange: (v: string) => void;
  onDurationBlur?: () => void;
  durationLabel: string;
  durationPlaceholder: string;
  durationInvalid: boolean;

  roundSeconds: string;
  onRoundSecondsChange: (v: string) => void;
  roundSecondsLabel: string;
  roundSecondsPlaceholder: string;
  roundSecondsInvalid: boolean;

  direction: "up" | "down";
  onDirectionChange: (v: "up" | "down") => void;
  directionLabel: string;
  directionDownLabel: string;
  directionUpLabel: string;
};

export function TimerDurationFields({
  duration,
  onDurationChange,
  onDurationBlur,
  durationLabel,
  durationPlaceholder,
  durationInvalid,
  roundSeconds,
  onRoundSecondsChange,
  roundSecondsLabel,
  roundSecondsPlaceholder,
  roundSecondsInvalid,
  direction,
  onDirectionChange,
  directionLabel,
  directionDownLabel,
  directionUpLabel,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeSheetStyles(colors), [colors]);

  return (
    <>
      <FormField icon="hourglass-outline" label={durationLabel}>
        <TextInput
          style={[styles.input, durationInvalid && styles.inputError]}
          value={duration}
          onChangeText={onDurationChange}
          onBlur={onDurationBlur}
          placeholder={durationPlaceholder}
          placeholderTextColor={colors.textPlaceholder}
          keyboardType="number-pad"
        />
      </FormField>

      <FormField icon="shield-checkmark-outline" label={roundSecondsLabel}>
        <TextInput
          style={[styles.input, roundSecondsInvalid && styles.inputError]}
          value={roundSeconds}
          onChangeText={onRoundSecondsChange}
          placeholder={roundSecondsPlaceholder}
          placeholderTextColor={colors.textPlaceholder}
          keyboardType="number-pad"
        />
      </FormField>

      <FormField icon="swap-vertical-outline" label={directionLabel}>
        <DirectionPicker
          value={direction}
          onChange={onDirectionChange}
          labelDown={directionDownLabel}
          labelUp={directionUpLabel}
        />
      </FormField>
    </>
  );
}
