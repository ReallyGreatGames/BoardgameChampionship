import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import type { Result } from "../models/result";
import type { TableBell } from "../models/table-bell";
import type { Timer } from "../models/timer";
import { useResultStore } from "../stores/appwrite/result-store";
import { formatElapsed, formatTime, resolveGameId, toNumberArray } from "../utils";
import { SearchInput } from "./SearchInput";
import { useScheduleStore } from "../stores/appwrite/schedule-store";
import { useTableBellStore } from "../stores/appwrite/table-bell-store";
import { useTimerStore } from "../stores/appwrite/timer-store";
import { inset } from "../theme/spacing";
import { type } from "../theme/typography";


type TablePlayer = { team: string; playerNumber: number };
type StaticTable = { id: number; gameId: string; players: TablePlayer[] };

type TableEntry = {
  id: number;
  players: TablePlayer[];
  timer: Timer | undefined;
  result: Result | undefined;
  bell: TableBell | undefined;
  hasBell: boolean;
  bellAcknowledged: boolean;
  isRunning: boolean;
  isSubmitted: boolean;
  hasNote: boolean;
};

type BellFilter = "any" | "active" | "acknowledged";
type SubmitFilter = "all" | "submitted" | "notSubmitted";
type TimerFilter = "any" | "running" | "noTimer";

const tables: StaticTable[] = [
  {
    id: 1,
    gameId: "69ebc7270030df761fca",
    players: [
      { team: "anal", playerNumber: 1 },
      { team: "ew4", playerNumber: 2 },
      { team: "erl", playerNumber: 3 },
      { team: "yin", playerNumber: 4 },
    ],
  },
  {
    id: 2,
    gameId: "69ebc7270030df761fca",
    players: [
      { team: "test", playerNumber: 1 },
      { team: "foob", playerNumber: 2 },
      { team: "hell", playerNumber: 3 },
      { team: "wrld", playerNumber: 4 },
    ],
  },
  {
    id: 3,
    gameId: "69ebc7270030df761fca",
    players: [
      { team: "xxxx", playerNumber: 1 },
      { team: "yyyy", playerNumber: 2 },
      { team: "zzzz", playerNumber: 3 },
      { team: "iiii", playerNumber: 4 },
    ],
  },
];

function renderSigIcon(
  i: number,
  sigIds: string[],
  isSubmitted: boolean,
  colors: ReturnType<typeof useTheme>["colors"],
) {
  const signed = !!sigIds[i];
  if (signed && isSubmitted) return <Ionicons name="checkmark-circle" size={12} color={colors.success} />;
  if (signed && !isSubmitted) return <Ionicons name="checkmark" size={12} color={colors.text} />;
  if (!signed && isSubmitted) return <Ionicons name="help-circle" size={12} color={colors.error} />;
  return null;
}

type ToggleFilterOption<T> = { value: T; icon: string; color: string; label: string };
type ToggleFilterProps<T extends string> = {
  options: ToggleFilterOption<T>[];
  value: T;
  onChange: (v: T) => void;
  styles: ReturnType<typeof makeStyles>;
};

function ToggleFilter<T extends string>({ options, value, onChange, styles }: ToggleFilterProps<T>) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const current = options[idx];
  const isNeutral = idx === 0;

  return (
    <TouchableOpacity
      style={[
        styles.toggleBtn,
        !isNeutral && { borderColor: current.color, backgroundColor: current.color + "22" },
      ]}
      onPress={() => onChange(options[(idx + 1) % options.length].value)}
      activeOpacity={0.7}
    >
      <Ionicons name={current.icon as any} size={14} color={current.color} />
      <Text style={[styles.toggleBtnText, { color: current.color }]}>{current.label}</Text>
    </TouchableOpacity>
  );
}

export function TableOverview() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["tableOverview"]);
  const [now, setNow] = useState(Date.now);
  const { width: screenWidth } = useWindowDimensions();

  const { collection: schedules } = useScheduleStore();
  const { collection: timers } = useTimerStore();
  const bells = useTableBellStore((s) => s.collection);
  const { collection: results } = useResultStore();

  const [search, setSearch] = useState("");
  const [bellFilter, setBellFilter] = useState<BellFilter>("any");
  const [submitFilter, setSubmitFilter] = useState<SubmitFilter>("all");
  const [timerFilter, setTimerFilter] = useState<TimerFilter>("any");
  const [gridWidth, setGridWidth] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const numColumns = screenWidth >= 900 ? 3 : screenWidth >= 600 ? 2 : 1;

  const cardWidth = useMemo(() => {
    if (!gridWidth) return 0;
    return (gridWidth - (numColumns - 1) * inset.list) / numColumns;
  }, [gridWidth, numColumns]);

  const activeSchedule = useMemo(
    () => schedules.find((s) => s.isActive),
    [schedules],
  );

  const tableEntries = useMemo<TableEntry[]>(() => {
    if (!activeSchedule?.gameId) return [];
    return tables
      .filter((t) => t.gameId === activeSchedule.gameId)
      .map((t): TableEntry => {
        const timer = timers.find((tm) => resolveGameId(tm.games) === activeSchedule.gameId && tm.table === t.id);
        const result = results.find((r) => r.gameId === activeSchedule.gameId && r.table === t.id);
        const bell = bells.find((b) => b.table === t.id);
        return {
          id: t.id,
          players: t.players,
          timer,
          result,
          bell,
          hasBell: !!bell && !bell.acknowledgeTime,
          bellAcknowledged: !!bell?.acknowledgeTime,
          isRunning: !!timer,
          isSubmitted: result?.submitted ?? false,
          hasNote: !!result?.note,
        };
      });
  }, [timers, results, bells, activeSchedule]);

  const filteredEntries = useMemo<TableEntry[]>(() => {
    const q = search.trim().toLowerCase();
    return tableEntries.filter((entry) => {
      if (q) {
        const hit = String(entry.id).includes(q) ||
          entry.players.some((p) => p.team.toLowerCase().includes(q));
        if (!hit) return false;
      }
      if (bellFilter === "active" && !entry.hasBell) return false;
      if (bellFilter === "acknowledged" && !entry.bellAcknowledged) return false;
      if (submitFilter === "submitted" && !entry.isSubmitted) return false;
      if (submitFilter === "notSubmitted") {
        const hasSig = entry.result?.signatureIds?.some(Boolean) ?? false;
        if (entry.isSubmitted || !entry.result || !hasSig) return false;
      }
      if (timerFilter === "running" && !entry.isRunning) return false;
      if (timerFilter === "noTimer" && !!entry.timer) return false;
      return true;
    });
  }, [tableEntries, search, bellFilter, submitFilter, timerFilter]);

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

  return (
    <ScrollView
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.gameLabel}>{activeSchedule.title}</Text>

      <SearchInput
        value={search}
        onChangeText={setSearch}
        placeholder={t("searchPlaceholder")}
      />

      <View style={styles.filtersRow}>
        <ToggleFilter<BellFilter>
          options={[
            { value: "any",          icon: "notifications-outline",     color: colors.textMuted, label: t("filterBellAny") },
            { value: "active",       icon: "notifications-outline",     color: colors.accent,    label: t("filterBellActive") },
            { value: "acknowledged", icon: "notifications-off-outline", color: colors.success,   label: t("filterBellAck") },
          ]}
          value={bellFilter}
          onChange={setBellFilter}
          styles={styles}
        />
        <ToggleFilter<SubmitFilter>
          options={[
            { value: "all",          icon: "document-outline",         color: colors.textMuted, label: t("filterSubmitAll") },
            { value: "submitted",    icon: "checkmark-circle-outline", color: colors.success,   label: t("filterSubmitYes") },
            { value: "notSubmitted", icon: "hourglass-outline",        color: colors.accent,    label: t("filterSubmitNo") },
          ]}
          value={submitFilter}
          onChange={setSubmitFilter}
          styles={styles}
        />
        <ToggleFilter<TimerFilter>
          options={[
            { value: "any",     icon: "timer-outline",       color: colors.textMuted,    label: t("filterTimerAny") },
            { value: "running", icon: "play-circle-outline", color: colors.primary,      label: t("filterTimerRunning") },
            { value: "noTimer", icon: "ban-outline",         color: colors.textSecondary, label: t("filterTimerNone") },
          ]}
          value={timerFilter}
          onChange={setTimerFilter}
          styles={styles}
        />
      </View>

      {filteredEntries.length === 0 && tableEntries.length > 0 && (
        <View style={styles.emptyFiltered}>
          <Text style={styles.emptyText}>{t("noFilterResults")}</Text>
        </View>
      )}

      <View
        style={styles.cardsGrid}
        onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
      >
        {filteredEntries.map((entry) => {
          const bell = entry.bell;
          const bellColor = bell?.acknowledgeTime ? colors.success : colors.accent;
          const sigIds: string[] = entry.result?.signatureIds ?? [];
          const playerTimes = toNumberArray(entry.timer?.playerTimes);

          return (
            <View
              key={entry.id}
              style={[
                styles.card,
                cardWidth > 0 ? { width: cardWidth } : { width: "100%" },
                entry.hasBell && styles.cardBellActive,
                entry.bellAcknowledged && styles.cardBellAcknowledged,
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.tableLabel}>{t("tableLabel").replace("{n}", String(entry.id))}</Text>
                <View style={styles.headerRight}>
                  {entry.result && (
                    <Ionicons
                      name="create-outline"
                      size={12}
                      color={entry.isSubmitted ? colors.success : colors.primary}
                    />
                  )}
                  {entry.hasNote && (
                    <Ionicons name="document-text-outline" size={12} color={colors.textSecondary} />
                  )}
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
                      <Text style={styles.teamName} numberOfLines={1}>{player.team} - {player.playerNumber}</Text>
                      <View style={styles.playerTimeRow}>
                        {entry.timer && !entry.isSubmitted ? <Text style={[styles.playerTime, isActive && styles.playerTimeActive]}>
                          {formatTime(playerTimes[i] ?? 0)}
                        </Text> : null}
                        {isActive && entry.timer?.paused && (
                          <Ionicons name="pause" size={9} color={colors.textMuted} />
                        )}
                        {entry.result && renderSigIcon(i, sigIds, entry.isSubmitted, colors)}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
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
    emptyFiltered: {
      paddingVertical: inset.group,
      alignItems: "center",
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
    filtersRow: {
      flexDirection: "row",
      gap: inset.tight,
      marginBottom: inset.list,
    },
    toggleBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    toggleBtnText: {
      ...type.caption,
    },
    cardsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: inset.list,
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
    teamName: {
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
