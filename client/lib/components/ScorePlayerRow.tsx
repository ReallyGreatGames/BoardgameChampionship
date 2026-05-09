import { useMemo } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import type { Player } from "../models/player";
import { space } from "../theme/spacing";
import { type } from "../theme/typography";
import { teamName } from "../utils";
import { SignatureSlot } from "./SignatureSlot";

const PLACEMENTS = ["1", "2", "3", "4"] as const;

type Props = {
  index: number;
  player: Player | undefined;
  placement: string;
  score: string;
  sigFileId: string | undefined;
  onSetPlacement: (idx: number, value: string) => void;
  onSetScore: (idx: number, value: string) => void;
  onSigPress: (idx: number) => void;
  t: (key: string) => string;
};

export function ScorePlayerRow({ index, player, placement, score, sigFileId, onSetPlacement, onSetScore, onSigPress, t }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <Text style={[styles.placementPrefix, placement ? styles.placementPrefixSet : styles.placementPrefixEmpty]}>
        {placement || "–"}
      </Text>

      <View style={styles.playerInfo}>
        <Text style={styles.playerName} numberOfLines={1}>
          {player ? player.name : `P${index + 1}`}
        </Text>
        {player && (
          <Text style={styles.playerTeam} numberOfLines={1}>
            {teamName(player)}
          </Text>
        )}
      </View>

      <View style={styles.placementRow}>
        {PLACEMENTS.map((p) => {
          const active = placement === p;
          return (
            <TouchableOpacity
              key={p}
              style={[styles.placementBtn, active && styles.placementBtnActive]}
              onPress={() => onSetPlacement(index, p)}
              activeOpacity={0.7}
            >
              <Text style={[styles.placementBtnLabel, active && styles.placementBtnLabelActive]}>
                {p}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TextInput
        style={styles.scoreInput}
        value={score}
        onChangeText={(v) => onSetScore(index, v)}
        placeholder={t("scorePlaceholder")}
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        returnKeyType="next"
      />

      <TouchableOpacity
        onPress={sigFileId ? () => onSigPress(index) : undefined}
        activeOpacity={sigFileId ? 0.7 : 1}
        disabled={!sigFileId}
      >
        <SignatureSlot fileId={sigFileId} />
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: space[2],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
      gap: space[1],
    },
    placementPrefix: { ...type.body, fontWeight: "700", width: 20, textAlign: "center" },
    placementPrefixSet: { color: colors.primary },
    placementPrefixEmpty: { color: colors.textMuted },
    playerInfo: { flex: 1, minWidth: 0 },
    playerName: { ...type.bodySmall, color: colors.text, fontWeight: "600" },
    playerTeam: { ...type.caption, color: colors.textMuted },
    placementRow: { flexDirection: "row", gap: 3, alignItems: "center" },
    placementBtn: {
      width: 26,
      height: 26,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    placementBtnActive: {
      width: 32,
      height: 32,
      borderRadius: 6,
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    placementBtnLabel: { ...type.bodySmall, color: colors.textSecondary },
    placementBtnLabelActive: { color: colors.onAccent, fontWeight: "600" },
    scoreInput: {
      width: 56,
      height: 34,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 5,
      paddingHorizontal: space[2],
      ...type.bodySmall,
      color: colors.text,
      backgroundColor: colors.surface,
      textAlign: "center",
    },
  });
}
