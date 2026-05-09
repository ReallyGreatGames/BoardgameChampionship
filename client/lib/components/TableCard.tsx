import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../bootstrap/ThemeProvider";
import { inset } from "../theme/spacing";
import { type } from "../theme/typography";
import { formatElapsed, formatTime, teamName, toNumberArray } from "../utils";
import type { TableEntry } from "./TableOverview";
import { SignatureStatusIcon } from "./SignatureStatusIcon";

type Props = {
  entry: TableEntry;
  cardWidth: number;
  now: number;
};

export function TableCard({ entry, cardWidth, now }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["tableOverview"]);

  const bell = entry.bell;
  const bellColor = bell?.acknowledgeTime ? colors.success : colors.accent;
  const sigIds: string[] = entry.result?.signatureIds ?? [];
  const playerTimes = toNumberArray(entry.timer?.playerTimes);

  return (
    <View
      style={[
        styles.card,
        cardWidth > 0 ? { width: cardWidth } : { width: "100%" },
        entry.hasBell && styles.cardBellActive,
        entry.bellAcknowledged && styles.cardBellAcknowledged,
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.tableLabel}>
          {t("tableLabel").replace("{n}", String(entry.id))}
        </Text>
        <View style={styles.headerRight}>
          {entry.result && (
            <Ionicons
              name="create-outline"
              size={12}
              color={entry.isSubmitted ? colors.success : colors.primary}
            />
          )}
          {entry.hasNote && (
            <Ionicons
              name="document-text-outline"
              size={12}
              color={colors.textSecondary}
            />
          )}
          {bell && (
            <View style={styles.bellStatus}>
              {bell.acknowledgeTime && (
                <Ionicons name="walk-outline" size={12} color={bellColor} />
              )}
              <Ionicons
                name={
                  bell.acknowledgeTime
                    ? "notifications-off-outline"
                    : "notifications-outline"
                }
                size={14}
                color={bellColor}
              />
              <Text style={[styles.bellTime, { color: bellColor }]}>
                {formatElapsed(bell.startTime, now)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.playersRow}>
        {entry.players.map((player, i) => {
          const isActive = entry.timer?.activePlayerTimer === i;
          return (
            <View key={i} style={styles.playerCell}>
              <Text style={styles.playerTeam} numberOfLines={1}>
                {teamName(player)}
              </Text>
              <Text style={styles.playerName} numberOfLines={1}>
                {player.name}
              </Text>
              <View style={styles.playerTimeRow}>
                {entry.timer && !entry.isSubmitted ? (
                  <Text
                    style={[
                      styles.playerTime,
                      isActive && styles.playerTimeActive,
                    ]}
                  >
                    {formatTime(playerTimes[i] ?? 0)}
                  </Text>
                ) : null}
                {isActive && entry.timer?.paused && (
                  <Ionicons name="pause" size={9} color={colors.textMuted} />
                )}
                {entry.result && (
                  <SignatureStatusIcon
                    index={i}
                    sigIds={sigIds}
                    isSubmitted={entry.isSubmitted}
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      overflow: "hidden",
    },
    cardBellActive: {
      borderColor: colors.accent,
    },
    cardBellAcknowledged: {
      borderColor: colors.success,
    },
    cardHeader: {
      backgroundColor: colors.surfaceHigh,
      paddingHorizontal: inset.card,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    tableLabel: {
      ...type.eyebrow,
      color: colors.textSecondary,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    bellStatus: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    bellTime: {
      ...type.eyebrow,
      letterSpacing: 0.5,
    },
    playersRow: {
      flexDirection: "row",
      paddingHorizontal: inset.card,
      paddingVertical: inset.tight,
      gap: inset.tight,
    },
    playerCell: {
      flex: 1,
      alignItems: "center",
      gap: 1,
    },
    playerTeam: {
      ...type.eyebrow,
      color: colors.text,
      fontWeight: "600",
    },
    playerName: {
      ...type.caption,
      color: colors.textSecondary,
    },
    playerTime: {
      fontFamily: "BarlowCondensed_700Bold",
      fontSize: 17,
      lineHeight: 20,
      color: colors.text,
    },
    playerTimeActive: {
      textDecorationLine: "underline",
      fontFamily: "BarlowCondensed_800ExtraBold",
    },
    playerTimeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
  });
}
