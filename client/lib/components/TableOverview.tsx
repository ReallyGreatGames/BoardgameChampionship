import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import { useScheduleStore } from "../stores/appwrite/schedule-store";
import { useTableBellStore } from "../stores/appwrite/table-bell-store";
import { useTimerStore } from "../stores/appwrite/timer-store";
import { inset } from "../theme/spacing";
import { type } from "../theme/typography";

/** Normalizes playerTimes — real-time payloads may serialize arrays as JSON strings */
function toNumberArray(value: unknown): number[] {
  if (Array.isArray(value)) return value as number[];
  if (typeof value === "string") {
    try { return JSON.parse(value) as number[]; } catch { return []; }
  }
  return [];
}

/** Handles string, object, or array shapes Appwrite may return for relationship fields */
function resolveGameId(ref: unknown): string | null {
  if (!ref) return null;
  if (typeof ref === "string") return ref;
  if (Array.isArray(ref)) {
    const first = ref[0];
    if (!first) return null;
    return typeof first === "string" ? first : (first as any).$id ?? null;
  }
  return (ref as any).$id ?? null;
}

function formatTime(s: number) {
  const clamped = Math.max(0, s);
  const m = Math.floor(clamped / 60)
    .toString()
    .padStart(2, "0");
  const sec = (clamped % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function formatElapsed(startTime: string) {
  const s = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

// TODO: This is not meant to show only timers but all tables.
// TODO: For each table show active times, active bells and the state of submitted game results
export function TableOverview() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["tableOverview"]);
  const [, setTick] = useState(0);

  const { collection: schedules } = useScheduleStore();
  const { collection: timers } = useTimerStore();
  const bells = useTableBellStore((s) => s.collection);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const activeSchedule = useMemo(
    () => schedules.find((s) => s.isActive),
    [schedules],
  );

  const activeTimers = useMemo(() => {
    if (!activeSchedule?.gameId) return [];
    return [
      ...timers
        .filter((t) => resolveGameId(t.games) === activeSchedule.gameId)
        .sort((a, b) => a.table - b.table),
    ];
  }, [timers, activeSchedule]);

  if (!activeSchedule) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t("noActiveSchedule")}</Text>
      </View>
    );
  }

  if (!activeSchedule.gameId) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t("noGame")}</Text>
      </View>
    );
  }

  if (activeTimers.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t("noTimers")}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    >
      {activeSchedule && <Text style={styles.gameLabel}>{activeSchedule.title}</Text>}
      {activeTimers.map((timer) => {
        const bell = bells.find((b) => b.table === timer.table);
        const bellColor = bell?.acknowledgeTime ? colors.success : colors.accent;

        return (
          <View key={timer.$id} style={[styles.card, bell && !bell.acknowledgeTime && styles.cardBellActive, bell?.acknowledgeTime && styles.cardBellAcknowledged]}>
            <View style={styles.cardHeader}>
              <Text style={styles.tableLabel}>Table {timer.table}</Text>
              {bell && (
                <View style={styles.bellStatus}>
                  {bell.acknowledgeTime && (
                    <Ionicons name="walk-outline" size={12} color={bellColor} />
                  )}
                  <Ionicons
                    name={bell.acknowledgeTime ? "notifications-off-outline" : "notifications-outline"}
                    size={14}
                    color={bellColor}
                  />
                  <Text style={[styles.bellTime, { color: bellColor }]}>
                    {formatElapsed(bell.startTime)}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.playersRow}>
              {toNumberArray(timer.playerTimes).map((t, i) => {
                const isActive = timer.activePlayerTimer === i;
                return (
                  <View key={i} style={styles.playerCell}>
                    <Text style={styles.playerLabel}>P{i + 1}</Text>
                    <Text style={[
                      styles.playerTime,
                      isActive && styles.playerTimeActive,
                    ]}>{formatTime(t)}</Text>
                    {isActive && timer.paused && (
                      <Ionicons name="pause" size={10} color={colors.textMuted} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyText: {
      ...type.bodySmall,
      color: colors.textMuted,
    },
    list: {
      gap: inset.list,
      paddingBottom: inset.screenBottom,
    },
    gameLabel: {
      ...type.h2,
      color: colors.text,
      marginBottom: inset.tight,
    },
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
      paddingVertical: inset.card,
      gap: inset.card,
    },
    playerCell: {
      flex: 1,
      alignItems: "center",
      gap: 2,
    },
    playerLabel: {
      ...type.eyebrow,
      color: colors.textMuted,
    },
    playerTime: {
      fontFamily: "BarlowCondensed_700Bold",
      fontSize: 22,
      lineHeight: 26,
      color: colors.text,
    },
    playerTimeActive: {
      textDecorationLine: "underline",
      fontFamily: "BarlowCondensed_800ExtraBold",
    },
  });
}
