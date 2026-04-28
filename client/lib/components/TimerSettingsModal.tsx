import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Pressable, Text, TextInput } from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import { useTimerSettingsStore } from "../stores/appwrite/timer-settings-store";
import { BottomSheet, makeSheetStyles } from "./BottomSheet";
import { DirectionPicker } from "./DirectionPicker";
import { FormField } from "./FormField";

type Props = {
  visible: boolean;
  gameId: string | null;
  onClose: () => void;
  /** Called when a new TimerSettings doc was created so the caller can update the linked gameId */
  onCreated?: (newGameId: string) => void;
};

export function TimerSettingsModal({ visible, gameId, onClose, onCreated }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeSheetStyles(colors), [colors]);
  const { t } = useTranslation(["components"]);
  const { collection, add, update } = useTimerSettingsStore();

  const existing = useMemo(
    () => (gameId ? collection.find((s) => s.$id === gameId) : undefined),
    [collection, gameId],
  );

  const [duration, setDuration] = useState("");
  const [direction, setDirection] = useState<"up" | "down">("down");
  const [saving, setSaving] = useState(false);
  const [durBlurred, setDurBlurred] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (existing) {
      setDuration(String(existing.durationMinutesTotal));
      setDirection(existing.direction);
    } else {
      setDuration("");
      setDirection("down");
    }
    setSaving(false);
    setDurBlurred(false);
  }, [visible, existing]);

  const durNum = parseInt(duration, 10);
  const durValid = !isNaN(durNum) && durNum > 0;

  async function handleSave() {
    if (!durValid || saving) return;
    setSaving(true);
    try {
      const data = { durationMinutesTotal: durNum, direction };
      if (existing) {
        const ok = await update({ $id: existing.$id, ...data });
        if (!ok) throw new Error();
      } else {
        const doc = await add(data);
        if (!doc) throw new Error();
        onCreated?.(doc.$id);
      }
      onClose();
    } catch {
      Alert.alert("Error", "Failed to save timer settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={existing ? t("timerSettingsModal.editTitle") : t("timerSettingsModal.addTitle")}
      footer={
        <Pressable
          style={[styles.saveBtn, (!durValid || saving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!durValid || saving}
        >
          {saving
            ? <ActivityIndicator size="small" color={colors.onAccent} />
            : <Text style={styles.saveBtnText}>{t("timerSettingsModal.save")}</Text>
          }
        </Pressable>
      }
    >
      <FormField icon="hourglass-outline" label={t("timerSettingsModal.durationField")}>
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
          placeholder={t("timerSettingsModal.durationPlaceholder")}
          placeholderTextColor={colors.textPlaceholder}
          keyboardType="number-pad"
        />
      </FormField>

      <FormField icon="swap-vertical-outline" label={t("timerSettingsModal.directionField")}>
        <DirectionPicker
          value={direction}
          onChange={setDirection}
          labelDown={t("timerSettingsModal.directionDown")}
          labelUp={t("timerSettingsModal.directionUp")}
        />
      </FormField>
    </BottomSheet>
  );
}
