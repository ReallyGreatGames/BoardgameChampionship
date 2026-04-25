import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import { useGameStore } from "../stores/appwrite/game-store";
import { useScheduleStore } from "../stores/appwrite/schedule-store";
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

export function TableOverview() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { collection: schedules } = useScheduleStore();
  const { collection: timers } = useTimerStore();
  const { collection: games } = useGameStore();

  const activeSchedule = useMemo(
    () => schedules.find((s) => s.isActive),
    [schedules],
  );

  const activeGame = useMemo(
    () =>
      activeSchedule?.gameId
        ? games.find((g) => g.$id === activeSchedule.gameId)
        : null,
    [games, activeSchedule],
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
        <Text style={styles.emptyText}>No active schedule item</Text>
      </View>
    );
  }

  if (!activeSchedule.gameId) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Active schedule item has no game</Text>
      </View>
    );
  }

  if (activeTimers.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No active timers for this game</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    >
      {activeGame && <Text style={styles.gameLabel}>{activeGame.name}</Text>}
      {activeTimers.map((timer) => (
        <View key={timer.$id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.tableLabel}>Table {timer.table}</Text>
          </View>
          <View style={styles.playersRow}>
            {toNumberArray(timer.playerTimes).map((t, i) => (
              <View key={i} style={styles.playerCell}>
                <Text style={styles.playerLabel}>P{i + 1}</Text>
                <Text style={styles.playerTime}>{formatTime(t)}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
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
    cardHeader: {
      backgroundColor: colors.surfaceHigh,
      paddingHorizontal: inset.card,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tableLabel: {
      ...type.eyebrow,
      color: colors.textSecondary,
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
  });
}
