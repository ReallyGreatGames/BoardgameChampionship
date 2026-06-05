import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../bootstrap/ThemeProvider";
import { inset, space } from "../theme/spacing";
import { type } from "../theme/typography";
import { formatElapsed, formatTime, teamName, toNumberArray } from "../utils";
import type { TableEntry } from "./TableOverview";
import { SignatureStatusIcon } from "./SignatureStatusIcon";
import { StateBadge } from "./StateBadge";

type Props = {
  entry: TableEntry;
  cardWidth: number;
  now: number;
  /** If provided, card is tappable and navigates to input mode. */
  onPress?: () => void;
  /** If provided, a bell action button is shown. */
  onBellPress?: () => void;
  bellLoading?: boolean;
};

export function TableCard({
  entry,
  cardWidth,
  now,
  onPress,
  onBellPress,
  bellLoading = false,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["tableOverview"]);

  const bell = entry.bell;
  const bellColor = bell?.acknowledgeTime ? colors.success : colors.accent;
  const sigIds: string[] = entry.result?.signatureIds ?? [];
  const storedTimes = toNumberArray(entry.timer?.playerTimes);
  const missingSig =
    !!entry.result && sigIds.length > 0 && sigIds.some((id) => !id);

  const playerTimes = useMemo(() => {
    const timer = entry.timer;
    if (!timer || entry.isSubmitted || timer.paused) return storedTimes;
    const activeIdx = timer.activePlayerTimer;
    if (activeIdx === null) return storedTimes;
    const elapsed = Math.floor(
      (now - new Date(timer.$updatedAt).getTime()) / 1000,
    );
    if (elapsed <= 0) return storedTimes;
    const live = [...storedTimes];
    live[activeIdx] = storedTimes[activeIdx] - elapsed;
    return live;
  }, [storedTimes, entry.timer, entry.isSubmitted, now]);

  const placements = entry.result?.placements ?? [];
  const scores = entry.result?.scores ?? [];

  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress
    ? { activeOpacity: 0.8, onPress }
    : {};

  return (
    <Wrapper
      style={[
        styles.card,
        cardWidth > 0 ? { width: cardWidth } : { width: "100%" },
        entry.hasBell && styles.cardBellActive,
        entry.bellAcknowledged && styles.cardBellAcknowledged,
        !entry.isSubmitted && entry.timer?.playersInOvertime?.some(Boolean) && styles.cardOvertimeWarning,
      ]}
      {...wrapperProps}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.tableLabel}>
          {t("tableLabel").replace("{n}", String(entry.id))}
        </Text>

        <View style={styles.headerRight}>
          {/* Result status */}
          {entry.result && (
            <StateBadge result={entry.result} t={t} />
          )}
          {/* Missing signature warning */}
          {missingSig && (
            <Ionicons name="warning-outline" size={16} color={colors.error} />
          )}
          {/* Note indicator */}
          {entry.hasNote && (
            <View style={styles.indicatorChip}>
              <Ionicons name="document-text-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.indicatorLabel}>{t("note")}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bell row — shown when a bell exists */}
      {bell && (
        <View
          style={[
            styles.bellRow,
            bell.acknowledgeTime ? styles.bellRowAck : styles.bellRowActive,
          ]}
        >
          <View style={styles.bellInfo}>
            <Ionicons
              name={bell.acknowledgeTime ? "notifications-off-outline" : "notifications-outline"}
              size={16}
              color={bellColor}
            />
            {bell.reason ? (
              <Text style={[styles.bellReason, { color: bellColor }]} numberOfLines={1}>
                {bell.reason}
              </Text>
            ) : (
              <Text style={[styles.bellReason, { color: bellColor }]}>
                {bell.acknowledgeTime ? t("bellAcknowledged") : t("bellActive")}
              </Text>
            )}
            <Text style={[styles.bellTimer, { color: bellColor }]}>
              {formatElapsed(bell.startTime, now)}
            </Text>
          </View>

          {onBellPress && (
            <TouchableOpacity
              style={[styles.bellActionBtn, { borderColor: bellColor }]}
              onPress={onBellPress}
              disabled={bellLoading}
              activeOpacity={0.7}
            >
              {bellLoading ? (
                <ActivityIndicator size="small" color={bellColor} />
              ) : (
                <Text style={[styles.bellActionLabel, { color: bellColor }]}>
                  {bell.acknowledgeTime ? t("bellDismiss") : t("bellAcknowledge")}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Players grid */}
      <View style={styles.playersRow}>
        {entry.players.map((player, i) => {
          const isActive = entry.timer?.activePlayerTimer === i;
          const placement = placements[i];
          const score = scores[i];

          return (
            <View key={i} style={styles.playerCell}>
              <Text style={styles.playerTeam} numberOfLines={1}>
                {teamName(player)}
              </Text>
              <Text style={styles.playerName} numberOfLines={1}>
                {player.name}
              </Text>

              <View style={styles.playerDataRow}>
                {/* Timer or placement/score */}
                {entry.timer && !entry.isSubmitted ? (
                isActive ? (
                  <View style={styles.activeTimerBadge}>
                    <Text style={styles.playerTimeActive}>
                      {formatTime(playerTimes[i] ?? 0)}
                    </Text>
                    {entry.timer.paused && (
                      <Ionicons name="pause" size={14} color="#000000" />
                    )}
                  </View>
                ) : (
                  <Text style={styles.playerTime}>
                    {formatTime(playerTimes[i] ?? 0)}
                  </Text>
                )
                ) : placement !== undefined ? (
                  <View style={styles.resultChip}>
                    <Text style={styles.resultPlacement}>
                      {placement || "–"}
                    </Text>
                    {score !== undefined && score !== 0 ? (
                      <Text style={styles.resultScore}>{score}</Text>
                    ) : null}
                  </View>
                ) : null}

                {/* Signature status */}
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

    </Wrapper>
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
      borderWidth: 2,
    },
    cardBellAcknowledged: {
      borderColor: colors.success,
      borderWidth: 2,
    },
    cardHeader: {
      backgroundColor: colors.surfaceHigh,
      paddingHorizontal: inset.card,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: space[2],
    },
    tableLabel: {
      ...type.bodySmall,
      color: colors.text,
      fontWeight: "700",
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[2],
      flexShrink: 1,
      flexWrap: "wrap",
      justifyContent: "flex-end",
    },
    indicatorChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: colors.surface,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    indicatorLabel: {
      ...type.caption,
      color: colors.textSecondary,
    },
    bellRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: inset.card,
      paddingVertical: 8,
      gap: space[2],
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    bellRowActive: {
      backgroundColor: colors.accent + "12",
    },
    bellRowAck: {
      backgroundColor: colors.success + "12",
    },
    bellInfo: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    bellReason: {
      ...type.caption,
      flex: 1,
    },
    bellTimer: {
      ...type.caption,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    bellActionBtn: {
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      minWidth: 72,
      alignItems: "center",
    },
    bellActionLabel: {
      ...type.caption,
      fontWeight: "600",
    },
    playersRow: {
      flexDirection: "row",
      paddingHorizontal: inset.card,
      paddingVertical: 10,
      gap: inset.tight,
    },
    playerCell: {
      flex: 1,
      alignItems: "center",
      gap: 2,
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
    playerDataRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      marginTop: 2,
    },
    playerTime: {
      fontFamily: "BarlowCondensed_600SemiBold",
      fontSize: 17,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    activeTimerBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: colors.primary + "20",
      borderRadius: 6,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    playerTimeActive: {
      fontFamily: "BarlowCondensed_800ExtraBold",
      fontSize: 17,
      lineHeight: 20,
      color: colors.primary,
    },
    cardOvertimeWarning: {
      borderLeftWidth: 4,
      borderLeftColor: colors.error,
    },
    resultChip: {
      alignItems: "center",
    },
    resultPlacement: {
      ...type.bodySmall,
      color: colors.primary,
      fontWeight: "700",
    },
    resultScore: {
      ...type.caption,
      color: colors.textMuted,
    },
  });
}
