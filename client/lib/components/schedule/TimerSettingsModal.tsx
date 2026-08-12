import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ColorPicker, { HueSlider, Panel1 } from "reanimated-color-picker";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { useTimerSettingsStore } from "@/lib/stores/appwrite/timer-settings-store";
import { PLAYER_COLORS } from "@/lib/utils/timerColors";
import { BottomSheet, makeSheetStyles } from "@/lib/components/ui/BottomSheet";
import { TimerDurationFields } from "@/lib/components/timer/TimerDurationFields";
import { useDurationRoundFields } from "@/lib/hooks/useDurationRoundFields";

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

  const [playerColors, setPlayerColors] = useState<string[]>(DEFAULT_COLORS);
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null);

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
    if (existing) {
      reset({
        duration: Math.round(existing.durationMinutesTotal / 4),
        roundSeconds: existing.roundSecondsTotal,
        direction: existing.direction,
      });
      setPlayerColors(
        existing.colors?.length === 4 ? existing.colors : DEFAULT_COLORS,
      );
    } else {
      reset();
      setPlayerColors(DEFAULT_COLORS);
    }
    setExpandedPlayer(null);
  }, [visible, existing, reset]);

  function setColor(playerIdx: number, hex: string) {
    setPlayerColors((prev) => {
      const next = [...prev];
      next[playerIdx] = hex;
      return next;
    });
  }

  async function handleSave() {
    if (!isValid || saving) {
      return;
    }
    setSaving(true);
    try {
      const data = {
        durationMinutesTotal: durNum * 4,
        roundSecondsTotal: roundSecondsNum,
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
          style={[styles.saveBtn, (!isValid || saving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!isValid || saving}
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
      <TimerDurationFields
        duration={duration}
        onDurationChange={setDuration}
        onDurationBlur={onDurationBlur}
        durationLabel={t("timerSettingsModal.durationField")}
        durationPlaceholder={t("timerSettingsModal.durationPlaceholder")}
        durationInvalid={durationInvalid}
        roundSeconds={roundSeconds}
        onRoundSecondsChange={setRoundSeconds}
        roundSecondsLabel={t("timerSettingsModal.roundSecondsField")}
        roundSecondsPlaceholder={t("timerSettingsModal.roundSecondsPlaceholder")}
        roundSecondsInvalid={roundSecondsInvalid}
        direction={direction}
        onDirectionChange={setDirection}
        directionLabel={t("timerSettingsModal.directionField")}
        directionDownLabel={t("timerSettingsModal.directionDown")}
        directionUpLabel={t("timerSettingsModal.directionUp")}
      />

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
