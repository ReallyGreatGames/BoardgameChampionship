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
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import {
  computeTableElapsedSeconds,
  formatElapsed,
  formatElapsedSeconds,
  formatTime,
  reconcileRoundAndPool,
  teamName,
} from "@/lib/utils";
import type { TableEntry } from "@/lib/components/results/types";
import { SignatureStatusIcon } from "@/lib/components/results/SignatureStatusIcon";
import { StateBadge } from "@/lib/components/results/StateBadge";

const PLAYER_COUNT = 4;
// A seat with no document yet is always treated as paused (see the
// fallbacks below), so this placeholder is never actually read for a real
// elapsed-time computation — hoisted so building it isn't repeated per seat
// per render.
const EPOCH_ISO = new Date(0).toISOString();

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
  const missingSig =
    !!entry.result && sigIds.length > 0 && sigIds.some((id) => !id);

  // Seats with no seat document yet (never touched) default to "full
  // pool"/"paused"/"fresh round" — matches useTimerState.ts's own defaults.
  // Each seat now lives in its own document (see lib/models/timer-seat.ts),
  // so a "missing" seat is simply absent from `entry.seats` rather than a
  // too-short array. Resolved once per seat here rather than re-scanning
  // `entry.seats` in each of the five memos below. Memoized off the raw
  // seat docs so identity stays stable across the once-a-second re-renders
  // driven by `now`, which is what lets the `playerTimes` memo further down
  // actually skip recomputing `reconcileRoundAndPool` most ticks.
  const seatByIndex = useMemo(
    () => Array.from({ length: PLAYER_COUNT }, (_, i) => entry.seats.find((s) => s.seat === i)),
    [entry.seats],
  );
  const storedTimes = useMemo(
    () => seatByIndex.map((s) => s?.playerTime ?? entry.timerTotalSeconds),
    [seatByIndex, entry.timerTotalSeconds],
  );
  const pausedFlags = useMemo(() => seatByIndex.map((s) => s?.paused ?? true), [seatByIndex]);
  const roundTimesLeft = useMemo(
    () => seatByIndex.map((s) => s?.roundTimeLeft ?? entry.timerRoundSecondsTotal),
    [seatByIndex, entry.timerRoundSecondsTotal],
  );
  const roundExpired = useMemo(() => seatByIndex.map((s) => s?.roundExpired ?? false), [seatByIndex]);
  const overtimeFlags = useMemo(() => seatByIndex.map((s) => s?.inOvertime ?? false), [seatByIndex]);
  // Per-seat `$updatedAt`, one per index — reconcileRoundAndPool fast-
  // forwards each seat from ITS OWN last-saved moment now that seats are
  // separate documents (see its doc comment). A seat with no document yet
  // is always paused via the fallback above, so this placeholder timestamp
  // is never actually read.
  const seatUpdatedAt = useMemo(() => seatByIndex.map((s) => s?.$updatedAt ?? EPOCH_ISO), [seatByIndex]);

  // Same derivation as useTimerState.ts's tableElapsedSeconds — accumulated
  // milliseconds from past active stretches, plus (while a seat is still
  // running) wall-clock time since the table's `tableActiveResumedAt`. Null
  // when the timer's never been touched at all, to tell "never started"
  // apart from a genuine 0.
  const tableElapsedSeconds = useMemo(() => {
    const timer = entry.timer;
    if (!timer) {
      return null;
    }
    const accumulatedMs =
      typeof timer.tableActiveAccumulatedMs === "number" ? timer.tableActiveAccumulatedMs : 0;
    return computeTableElapsedSeconds(accumulatedMs, timer.tableActiveResumedAt, now);
  }, [entry.timer?.tableActiveAccumulatedMs, entry.timer?.tableActiveResumedAt, now]);

  // Pool time must not appear to drain while a seat is still in its
  // round-time phase — reconcile both together, same as the live timer, and
  // only surface the pool half here.
  const playerTimes = useMemo(() => {
    const timer = entry.timer;
    if (!timer || entry.isSubmitted) {
      return storedTimes;
    }
    return reconcileRoundAndPool(
      storedTimes,
      roundTimesLeft,
      roundExpired,
      pausedFlags,
      entry.timerRoundSecondsTotal,
      seatUpdatedAt,
      now,
    ).poolTimes;
  }, [
    storedTimes,
    roundTimesLeft,
    roundExpired,
    pausedFlags,
    seatUpdatedAt,
    entry.timer,
    entry.timerRoundSecondsTotal,
    entry.isSubmitted,
    now,
  ]);

  const displayTime = (seconds: number) =>
    entry.timerDirection === "up" ? entry.timerTotalSeconds - seconds : seconds;

  // Pool time goes negative once exhausted (both directions tick the same
  // underlying value — see useTimerState.ts). `formatTime` clamps negatives
  // to 00:00, which froze the display at zero for "down" and let "up" grow
  // past the total instead — neither showed how far over anyone actually is.
  // Once in overtime, show just the overage, regardless of direction.
  const formatPlayerTime = (seconds: number, isOvertime: boolean) =>
    isOvertime ? `+${formatTime(-seconds)}` : formatTime(displayTime(seconds));

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
        !entry.isSubmitted && overtimeFlags.some(Boolean) && styles.cardOvertimeWarning,
      ]}
      {...wrapperProps}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.tableLabel}>
          {t("tableLabel").replace("{n}", String(entry.id))}
        </Text>

        <View style={styles.headerRight}>
          {/* Table-wide elapsed time — only once the timer's been touched
              at all (see tableElapsedSeconds), small/secondary like on the
              live timer screen's own display. */}
          {tableElapsedSeconds !== null && (
            <View style={styles.indicatorChip}>
              <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.indicatorLabel}>{formatElapsedSeconds(tableElapsedSeconds)}</Text>
            </View>
          )}
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
          const isRunning = entry.timer ? !pausedFlags[i] : false;
          // While a round is active, its pool hasn't actually run out yet
          // from the player's perspective — matches TimerCell.tsx, which
          // ignores pool-overtime entirely for the same seat/round state.
          const roundActive = entry.timerRoundSecondsTotal > 0 && !roundExpired[i];
          // The persisted flag only updates on the next explicit action
          // (press/pause), not continuously as the pool depletes — for
          // direction "down" that's masked by the display freezing at 00:00
          // anyway, but "up" would otherwise just keep counting past the
          // total with no visual cue. Derive it live from the already-
          // reconciled pool time too, same as useTimerState.ts does.
          const isOvertime =
            !roundActive && ((overtimeFlags[i] ?? false) || (playerTimes[i] ?? 0) <= 0);
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
                isRunning ? (
                  <View
                    style={[
                      styles.activeTimerBadge,
                      isOvertime && { backgroundColor: colors.error + "25" },
                    ]}
                  >
                    <Ionicons
                      name="play"
                      size={11}
                      color={isOvertime ? colors.error : colors.primary}
                    />
                    <Text
                      style={[
                        styles.playerTimeActive,
                        isOvertime && { color: colors.error },
                      ]}
                    >
                      {formatPlayerTime(playerTimes[i] ?? 0, isOvertime)}
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={[styles.playerTime, isOvertime && { color: colors.error }]}
                  >
                    {formatPlayerTime(playerTimes[i] ?? 0, isOvertime)}
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
