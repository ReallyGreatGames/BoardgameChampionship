import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ColorPicker, { HueSlider, Panel1 } from "reanimated-color-picker";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { useTimerSettingsStore } from "@/lib/stores/appwrite/timer-settings-store";
import { PLAYER_COLORS } from "@/lib/utils/timerColors";
import { BottomSheet, makeSheetStyles } from "@/lib/components/ui/BottomSheet";
import { DirectionPicker } from "@/lib/components/ui/DirectionPicker";
import { FormField } from "@/lib/components/ui/FormField";

const DEFAULT_COLORS = PLAYER_COLORS.map((c) => c.active);

type Props = {
  visible: boolean;
  gameId: string | null;
  onClose: () => void;
  onCreated?: (newGameId: string) => void;
};

export function TimerSettingsModal({
  visible,
  gameId,
  onClose,
  onCreated,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeSheetStyles(colors), [colors]);
  const pickerStyles = useMemo(() => makePickerStyles(colors), [colors]);
  const { t } = useTranslation(["components"]);
  const { collection, add, update } = useTimerSettingsStore();

  const existing = useMemo(
    () => (gameId ? collection.find((s) => s.$id === gameId) : undefined),
    [collection, gameId],
  );

  const [duration, setDuration] = useState("");
  const [direction, setDirection] = useState<"up" | "down">("down");
  const [playerColors, setPlayerColors] = useState<string[]>(DEFAULT_COLORS);
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [durBlurred, setDurBlurred] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (existing) {
      setDuration(String(Math.round(existing.durationMinutesTotal / 4)));
      setDirection(existing.direction);
      setPlayerColors(
        existing.colors?.length === 4 ? existing.colors : DEFAULT_COLORS,
      );
    } else {
      setDuration("");
      setDirection("down");
      setPlayerColors(DEFAULT_COLORS);
    }
    setSaving(false);
    setDurBlurred(false);
    setExpandedPlayer(null);
  }, [visible, existing]);

  const durNum = parseInt(duration, 10);
  const durValid = !isNaN(durNum) && durNum > 0;

  function setColor(playerIdx: number, hex: string) {
    setPlayerColors((prev) => {
      const next = [...prev];
      next[playerIdx] = hex;
      return next;
    });
  }

  async function handleSave() {
    if (!durValid || saving) {
      return;
    }
    setSaving(true);
    try {
      const data = {
        durationMinutesTotal: durNum * 4,
        direction,
        colors: playerColors,
      };
      if (existing) {
        const ok = await update({ $id: existing.$id, ...data });
        if (!ok) {
          throw new Error();
        }
      } else {
        const doc = await add(data);
        if (!doc) {
          throw new Error();
        }
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
      title={
        existing
          ? t("timerSettingsModal.editTitle")
          : t("timerSettingsModal.addTitle")
      }
      footer={
        <Pressable
          style={[
            styles.saveBtn,
            (!durValid || saving) && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={!durValid || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.onAccent} />
          ) : (
            <Text style={styles.saveBtnText}>
              {t("timerSettingsModal.save")}
            </Text>
          )}
        </Pressable>
      }
    >
      <FormField
        icon="hourglass-outline"
        label={t("timerSettingsModal.durationField")}
      >
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
              if (!isNaN(n) && n > 0) {
                setDurBlurred(false);
              }
            }
          }}
          onBlur={() => setDurBlurred(true)}
          placeholder={t("timerSettingsModal.durationPlaceholder")}
          placeholderTextColor={colors.textPlaceholder}
          keyboardType="number-pad"
        />
      </FormField>

      <FormField
        icon="swap-vertical-outline"
        label={t("timerSettingsModal.directionField")}
      >
        <DirectionPicker
          value={direction}
          onChange={setDirection}
          labelDown={t("timerSettingsModal.directionDown")}
          labelUp={t("timerSettingsModal.directionUp")}
        />
      </FormField>

      {playerColors.map((hex, i) => {
        const isOpen = expandedPlayer === i;
        return (
          <View key={i} style={pickerStyles.playerRow}>
            <TouchableOpacity
              style={pickerStyles.playerHeader}
              onPress={() => setExpandedPlayer(isOpen ? null : i)}
              activeOpacity={0.7}
            >
              <View style={[pickerStyles.colorDot, { backgroundColor: hex }]} />
              <Text style={pickerStyles.playerLabel}>
                {t("timerSettingsModal.playerColorField", { n: i + 1 })}
              </Text>
              <Text style={pickerStyles.chevron}>{isOpen ? "▲" : "▼"}</Text>
            </TouchableOpacity>

            {isOpen && (
              <ColorPicker
                value={hex}
                onComplete={(c) => setColor(i, c.hex)}
                style={pickerStyles.picker}
              >
                <Panel1 style={pickerStyles.panel} />
                <HueSlider style={pickerStyles.hueSlider} />
              </ColorPicker>
            )}
          </View>
        );
      })}
    </BottomSheet>
  );
}

function makePickerStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    playerRow: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      overflow: "hidden",
    },
    playerHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
      backgroundColor: colors.surfaceHigh,
    },
    colorDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    playerLabel: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
    },
    chevron: {
      color: colors.textMuted,
      fontSize: 10,
    },
    picker: {
      padding: 12,
      backgroundColor: colors.surface,
      gap: 12,
    },
    panel: {
      height: 180,
      borderRadius: 8,
    },
    hueSlider: {
      height: 24,
      borderRadius: 12,
    },
  });
}
