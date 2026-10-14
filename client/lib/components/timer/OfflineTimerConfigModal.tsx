import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { BottomSheet, makeSheetStyles } from "@/lib/components/ui/BottomSheet";
import { TimerDurationFields } from "@/lib/components/timer/TimerDurationFields";
import { useDurationRoundFields } from "@/lib/hooks/useDurationRoundFields";
import { OfflineTimerConfig } from "@/lib/hooks/useOfflineTimer";

type Props = {
  visible: boolean;
  onClose: () => void;
  initialConfig?: OfflineTimerConfig;
  onStart: (config: OfflineTimerConfig) => void;
};

export function OfflineTimerConfigModal({
  visible,
  onClose,
  initialConfig,
  onStart,
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
      duration: initialConfig?.perPlayerMinutes,
      roundSeconds: initialConfig?.roundSecondsTotal,
      direction: initialConfig?.direction,
    });
  }, [visible, initialConfig, reset]);

  function handleStart() {
    if (!isValid || saving) {
      return;
    }
    setSaving(true);
    onStart({
      perPlayerMinutes: durNum,
      roundSecondsTotal: roundSecondsNum,
      direction,
    });
    setSaving(false);
    onClose();
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t("offlineConfig.title")}
      footer={
        <Pressable
          style={[styles.saveBtn, (!isValid || saving) && styles.saveBtnDisabled]}
          onPress={handleStart}
          disabled={!isValid || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.onAccent} />
          ) : (
            <Text style={styles.saveBtnText}>{t("offlineConfig.start")}</Text>
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
