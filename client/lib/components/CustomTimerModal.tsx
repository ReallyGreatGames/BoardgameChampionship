import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import { BottomSheet, makeSheetStyles } from "./BottomSheet";
import { DirectionPicker } from "./DirectionPicker";
import { FormField } from "./FormField";
import { TextInput } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  initialDuration?: number;
  initialDirection?: "up" | "down";
  onSave: (duration: number, direction: "up" | "down") => Promise<void>;
};

export function CustomTimerModal({ visible, onClose, initialDuration, initialDirection, onSave }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeSheetStyles(colors), [colors]);
  const { t } = useTranslation(["timer"]);

  const [duration, setDuration] = useState("");
  const [direction, setDirection] = useState<"up" | "down">("down");
  const [saving, setSaving] = useState(false);
  const [durBlurred, setDurBlurred] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDuration(initialDuration != null ? String(initialDuration) : "");
    setDirection(initialDirection ?? "down");
    setSaving(false);
    setDurBlurred(false);
  }, [visible, initialDuration, initialDirection]);

  const durNum = parseInt(duration, 10);
  const durValid = !isNaN(durNum) && durNum > 0;

  async function handleSave() {
    if (!durValid || saving) return;
    setSaving(true);
    try {
      await onSave(durNum, direction);
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
          style={[styles.saveBtn, (!durValid || saving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!durValid || saving}
        >
          {saving
            ? <ActivityIndicator size="small" color={colors.onAccent} />
            : <Text style={styles.saveBtnText}>{t("customTimerModal.save")}</Text>
          }
        </Pressable>
      }
    >
      <FormField icon="hourglass-outline" label={t("customTimerModal.durationField")}>
        <TextInput
          style={[
            styles.input,
            durBlurred && duration !== "" && !durValid && styles.inputError,
          ]}
          value={duration}
          onChangeText={(v) => {
            setDuration(v);
            if (durBlurred) {
              const n = parseInt(v, 10);
              if (!isNaN(n) && n > 0) setDurBlurred(false);
            }
          }}
          onBlur={() => setDurBlurred(true)}
          placeholder={t("customTimerModal.durationPlaceholder")}
          placeholderTextColor={colors.textPlaceholder}
          keyboardType="number-pad"
        />
      </FormField>

      <FormField icon="swap-vertical-outline" label={t("customTimerModal.directionField")}>
        <DirectionPicker
          value={direction}
          onChange={setDirection}
          labelDown={t("customTimerModal.directionDown")}
          labelUp={t("customTimerModal.directionUp")}
        />
      </FormField>
    </BottomSheet>
  );
}
