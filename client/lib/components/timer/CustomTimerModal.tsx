import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { BottomSheet, makeSheetStyles } from "@/lib/components/ui/BottomSheet";
import { TimerDurationFields } from "@/lib/components/timer/TimerDurationFields";
import { useDurationRoundFields } from "@/lib/hooks/useDurationRoundFields";

type Props = {
  visible: boolean;
  onClose: () => void;
  initialDuration?: number;
  initialDirection?: "up" | "down";
  initialRoundSeconds?: number;
  onSave: (duration: number, direction: "up" | "down", roundSeconds: number) => Promise<void>;
};

export function CustomTimerModal({
  visible,
  onClose,
  initialDuration,
  initialDirection,
  initialRoundSeconds,
  onSave,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeSheetStyles(colors), [colors]);
  const { t } = useTranslation(["timer"]);

  const {
    duration,
    roundSeconds,
    direction,
    saving,
    durNum,
    roundSecondsNum,
    isValid,
    durationInvalid,
    roundSecondsInvalid,
    setDuration,
    setRoundSeconds,
    setDirection,
    setSaving,
    onDurationBlur,
    reset,
  } = useDurationRoundFields();

  useEffect(() => {
    if (!visible) {
      return;
    }
    reset({
      duration: initialDuration != null ? Math.round(initialDuration / 4) : undefined,
      roundSeconds: initialRoundSeconds,
      direction: initialDirection,
    });
  }, [visible, initialDuration, initialDirection, initialRoundSeconds, reset]);

  async function handleSave() {
    if (!isValid || saving) {
      return;
    }
    setSaving(true);
    try {
      await onSave(durNum * 4, direction, roundSecondsNum);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t("customTimerModal.title")}
      footer={
        <Pressable
          style={[styles.saveBtn, (!isValid || saving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!isValid || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.onAccent} />
          ) : (
            <Text style={styles.saveBtnText}>{t("customTimerModal.save")}</Text>
          )}
        </Pressable>
      }
    >
      <TimerDurationFields
        duration={duration}
        onDurationChange={setDuration}
        onDurationBlur={onDurationBlur}
        durationLabel={t("customTimerModal.durationField")}
        durationPlaceholder={t("customTimerModal.durationPlaceholder")}
        durationInvalid={durationInvalid}
        roundSeconds={roundSeconds}
        onRoundSecondsChange={setRoundSeconds}
        roundSecondsLabel={t("customTimerModal.roundSecondsField")}
        roundSecondsPlaceholder={t("customTimerModal.roundSecondsPlaceholder")}
        roundSecondsInvalid={roundSecondsInvalid}
        direction={direction}
        onDirectionChange={setDirection}
        directionLabel={t("customTimerModal.directionField")}
        directionDownLabel={t("customTimerModal.directionDown")}
        directionUpLabel={t("customTimerModal.directionUp")}
      />
    </BottomSheet>
  );
}
