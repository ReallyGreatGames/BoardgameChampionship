import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { BottomSheet, makeSheetStyles } from "@/lib/components/ui/BottomSheet";
import { TimerDurationFields } from "@/lib/components/timer/TimerDurationFields";

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

  const [duration, setDuration] = useState("");
  const [roundSeconds, setRoundSeconds] = useState("");
  const [direction, setDirection] = useState<"up" | "down">("down");
  const [saving, setSaving] = useState(false);
  const [durBlurred, setDurBlurred] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setDuration(initialDuration != null ? String(Math.round(initialDuration / 4)) : "");
    setRoundSeconds(initialRoundSeconds ? String(initialRoundSeconds) : "");
    setDirection(initialDirection ?? "down");
    setSaving(false);
    setDurBlurred(false);
  }, [visible, initialDuration, initialDirection, initialRoundSeconds]);

  const durNum = parseInt(duration, 10);
  const durValid = !isNaN(durNum) && durNum > 0;
  const roundSecondsNum = roundSeconds.trim() === "" ? 0 : parseInt(roundSeconds, 10);
  const roundSecondsValid = !isNaN(roundSecondsNum) && roundSecondsNum >= 0;

  async function handleSave() {
    if (!durValid || !roundSecondsValid || saving) {
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
          style={[
            styles.saveBtn,
            (!durValid || !roundSecondsValid || saving) && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={!durValid || !roundSecondsValid || saving}
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
        onDurationChange={(v) => {
          setDuration(v);
          if (durBlurred) {
            const n = parseInt(v, 10);
            if (!isNaN(n) && n > 0) {
              setDurBlurred(false);
            }
          }
        }}
        onDurationBlur={() => setDurBlurred(true)}
        durationLabel={t("customTimerModal.durationField")}
        durationPlaceholder={t("customTimerModal.durationPlaceholder")}
        durationInvalid={durBlurred && duration !== "" && !durValid}
        roundSeconds={roundSeconds}
        onRoundSecondsChange={setRoundSeconds}
        roundSecondsLabel={t("customTimerModal.roundSecondsField")}
        roundSecondsPlaceholder={t("customTimerModal.roundSecondsPlaceholder")}
        roundSecondsInvalid={roundSeconds !== "" && !roundSecondsValid}
        direction={direction}
        onDirectionChange={setDirection}
        directionLabel={t("customTimerModal.directionField")}
        directionDownLabel={t("customTimerModal.directionDown")}
        directionUpLabel={t("customTimerModal.directionUp")}
      />
    </BottomSheet>
  );
}
