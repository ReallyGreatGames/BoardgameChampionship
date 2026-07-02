import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { Player } from "@/lib/models/player";
import { inset } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { PLAYER_COLORS } from "@/lib/utils/timerColors";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BottomSheet, makeSheetStyles } from "@/lib/components/ui/BottomSheet";

const SWATCHES = PLAYER_COLORS.map((c) => c.active);

// Mirror the timer's grid layout: top row = [0,1], bottom row = [3,2]
const GRID_ROWS = [
  [0, 1],
  [3, 2],
] as const;

const CORNER_KEYS = [
  "colorSetup.corners.topLeft",
  "colorSetup.corners.topRight",
  "colorSetup.corners.bottomRight",
  "colorSetup.corners.bottomLeft",
] as const;

type Assignment = { playerId: string | null; color: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  players: Player[];
  onSave: (playerIds: (string | null)[], colors: string[]) => Promise<void>;
  customColors?: string[];
};

export function PlayerColorSetupModal({
  visible,
  onClose,
  players,
  onSave,
  customColors,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeSheetStyles(colors), [colors]);
  const { t } = useTranslation(["game"]);

  const colorsToUse = useMemo(
    () => SWATCHES.map((c, i) => customColors?.[i] ?? c),
    [customColors],
  );

  const [assignments, setAssignments] = useState<Assignment[]>(() =>
    Array.from({ length: 4 }, (_, i) => ({
      playerId: players[i]?.$id ?? null,
      color: colorsToUse[i],
    })),
  );
  const [saving, setSaving] = useState(false);

  const hasDuplicatePlayers = useMemo(() => {
    const ids = assignments.map((a) => a.playerId).filter(Boolean);
    return ids.length !== new Set(ids).size;
  }, [assignments]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setAssignments(
      Array.from({ length: 4 }, (_, i) => ({
        playerId: players[i]?.$id ?? null,
        color: colorsToUse[i],
      })),
    );
    setSaving(false);
  }, [visible, players, colorsToUse]);

  function cyclePlayer(posIdx: number) {
    if (players.length === 0) {
      return;
    }
    setAssignments((prev) => {
      const cur = prev[posIdx].playerId;
      const curPlayerIdx = players.findIndex((p) => p.$id === cur);
      const nextPlayerIdx = (curPlayerIdx + 1) % players.length;
      const next = [...prev];
      next[posIdx] = { ...next[posIdx], playerId: players[nextPlayerIdx].$id };
      return next;
    });
  }

  function setColor(posIdx: number, hex: string) {
    setAssignments((prev) => {
      const next = [...prev];
      next[posIdx] = { ...next[posIdx], color: hex };
      return next;
    });
  }

  async function handleSave() {
    if (saving) {
      return;
    }
    setSaving(true);
    try {
      await onSave(
        assignments.map((a) => a.playerId),
        assignments.map((a) => a.color),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t("colorSetup.title")}
      footer={
        <View style={{ gap: 8 }}>
          {hasDuplicatePlayers && (
            <Text
              style={[
                type.bodySmall,
                { color: colors.textMuted, textAlign: "center" },
              ]}
            >
              {t("colorSetup.duplicatePlayer")}
            </Text>
          )}
          <Pressable
            style={[
              styles.saveBtn,
              (saving || hasDuplicatePlayers) && styles.saveBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={saving || hasDuplicatePlayers}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.onAccent} />
            ) : (
              <Text style={styles.saveBtnText}>{t("colorSetup.save")}</Text>
            )}
          </Pressable>
        </View>
      }
    >
      {GRID_ROWS.map((row, rowIdx) => (
        <View key={rowIdx} style={{ flexDirection: "row", gap: inset.card }}>
          {row.map((posIdx) => {
            const assignment = assignments[posIdx];
            const playerName = players.find(
              (p) => p.$id === assignment.playerId,
            )?.name;
            return (
              <View
                key={posIdx}
                style={{
                  flex: 1,
                  backgroundColor: colors.surfaceHigh,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: inset.card,
                  gap: 10,
                }}
              >
                <Text style={[type.eyebrow, { color: colors.textMuted }]}>
                  {t(CORNER_KEYS[posIdx])}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => cyclePlayer(posIdx)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: colors.surface,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                  }}
                >
                  <Text
                    style={[type.bodySmall, { color: colors.text, flex: 1 }]}
                    numberOfLines={1}
                  >
                    {playerName ??
                      t("colorSetup.playerFallback", { number: posIdx + 1 })}
                  </Text>
                  <Ionicons
                    name="swap-horizontal"
                    size={12}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>

                <View style={{ flexDirection: "row", gap: 6 }}>
                  {colorsToUse.map((hex) => {
                    const isSelected = assignment.color === hex;
                    return (
                      <Pressable
                        key={hex}
                        onPress={() => setColor(posIdx, hex)}
                        style={{
                          flex: 1,
                          aspectRatio: 1,
                          borderRadius: 99,
                          backgroundColor: hex,
                          borderWidth: isSelected ? 2 : 1,
                          borderColor: isSelected ? "#ffffff" : hex + "44",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={12}
                            color="#ffffff"
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </BottomSheet>
  );
}
