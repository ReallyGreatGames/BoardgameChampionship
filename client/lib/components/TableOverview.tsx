import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import { Player } from "../models/player";
import type { Result } from "../models/result";
import type { TableBell } from "../models/table-bell";
import type { Timer } from "../models/timer";
import { useResultStore } from "../stores/appwrite/result-store";
import { useScheduleStore } from "../stores/appwrite/schedule-store";
import { useTableBellStore } from "../stores/appwrite/table-bell-store";
import { useTableStore } from "../stores/appwrite/table-store";
import { useTimerStore } from "../stores/appwrite/timer-store";
import { inset } from "../theme/spacing";
import { resolveGameId, teamName } from "../utils";
import { ChipGroup } from "./ChipGroup";
import { EmptyState } from "./EmptyState";
import { SearchInput } from "./SearchInput";
import { TableCard } from "./TableCard";

export type TableEntry = {
  id: number;
  players: Player[];
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
  const tables = useTableStore((s) => s.collection);

  const [search, setSearch] = useState("");
  const [bellFilter, setBellFilter] = useState<BellFilter>("any");
  const [submitFilter, setSubmitFilter] = useState<SubmitFilter>("all");
  const [timerFilter, setTimerFilter] = useState<TimerFilter>("any");
  const [gridWidth, setGridWidth] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const numColumns = screenWidth >= 600 ? 2 : 1;

  const cardWidth = useMemo(() => {
    if (!gridWidth) {return 0;}
    return (gridWidth - (numColumns - 1) * inset.list) / numColumns;
  }, [gridWidth, numColumns]);

  const gameSchedules = useMemo(
    () =>
      [...schedules]
        .filter((s) => !!s.gameId)
        .sort((a, b) => a.sortIndex - b.sortIndex),
    [schedules],
  );

  const defaultGameId = useMemo(() => {
    const active = gameSchedules.find((s) => s.isActive);
    if (active) {return active.gameId!;}
    const nextUp = gameSchedules.find((s) => !s.isFinished);
    if (nextUp) {return nextUp.gameId!;}
    return gameSchedules[gameSchedules.length - 1]?.gameId ?? null;
  }, [gameSchedules]);

  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedGameId === null && defaultGameId !== null) {
      setSelectedGameId(defaultGameId);
    }
  }, [defaultGameId, selectedGameId]);

  const tableEntries = useMemo<TableEntry[]>(() => {
    if (!selectedGameId) {return [];}
    return tables
      .filter((t) => resolveGameId(t.game) === selectedGameId)
      .sort((a, b) => a.tableNumber - b.tableNumber)
      .map((t): TableEntry => {
        const timer = timers.find(
          (tm) =>
            resolveGameId(tm.games) === selectedGameId &&
            tm.table === t.tableNumber,
        );
        const result = results.find(
          (r) => r.gameId === selectedGameId && r.table === t.tableNumber,
        );
        const bell = bells.find((b) => b.table === t.tableNumber);
        return {
          id: t.tableNumber,
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
  }, [tables, timers, results, bells, selectedGameId]);

  const filteredEntries = useMemo<TableEntry[]>(() => {
    const q = search.trim().toLowerCase();
    return tableEntries.filter((entry) => {
      if (q) {
        const hit =
          String(entry.id).includes(q) ||
          entry.players.some((p) => teamName(p).toLowerCase().includes(q));
        if (!hit) {
          return false;
        }
      }
      if (bellFilter === "active" && !entry.hasBell) {
        return false;
      }
      if (bellFilter === "acknowledged" && !entry.bellAcknowledged) {
        return false;
      }
      if (submitFilter === "submitted" && !entry.isSubmitted) {
        return false;
      }
      if (submitFilter === "notSubmitted") {
        const hasSig = entry.result?.signatureIds?.some(Boolean) ?? false;
        if (entry.isSubmitted || !entry.result || !hasSig) {
          return false;
        }
      }
      if (timerFilter === "running" && !entry.isRunning) {
        return false;
      }
      if (timerFilter === "noTimer" && !!entry.timer) {
        return false;
      }
      return true;
    });
  }, [tableEntries, search, bellFilter, submitFilter, timerFilter]);

  if (gameSchedules.length === 0) {
    return <EmptyState message={t("noGame")} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.stickyHeader}>
        <ChipGroup
          mode="select"
          options={gameSchedules.map((s) => ({
            value: s.gameId!,
            label: s.title,
            isLive: s.isActive,
          }))}
          value={selectedGameId ?? ""}
          onChange={(v) => setSelectedGameId(v)}
        />

        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder={t("searchPlaceholder")}
        />

        <View style={styles.filtersRow}>
          <ChipGroup<BellFilter>
            mode="cycle"
            options={[
              { value: "any", icon: "notifications-outline", color: colors.textMuted, label: t("filterBellAny") },
              { value: "active", icon: "notifications-outline", color: colors.accent, label: t("filterBellActive") },
              { value: "acknowledged", icon: "notifications-off-outline", color: colors.success, label: t("filterBellAck") },
            ]}
            value={bellFilter}
            onChange={setBellFilter}
          />
          <ChipGroup<SubmitFilter>
            mode="cycle"
            options={[
              { value: "all", icon: "document-outline", color: colors.textMuted, label: t("filterSubmitAll") },
              { value: "submitted", icon: "checkmark-circle-outline", color: colors.success, label: t("filterSubmitYes") },
              { value: "notSubmitted", icon: "hourglass-outline", color: colors.accent, label: t("filterSubmitNo") },
            ]}
            value={submitFilter}
            onChange={setSubmitFilter}
          />
          <ChipGroup<TimerFilter>
            mode="cycle"
            options={[
              { value: "any", icon: "timer-outline", color: colors.textMuted, label: t("filterTimerAny") },
              { value: "running", icon: "play-circle-outline", color: colors.primary, label: t("filterTimerRunning") },
              { value: "noTimer", icon: "ban-outline", color: colors.textSecondary, label: t("filterTimerNone") },
            ]}
            value={timerFilter}
            onChange={setTimerFilter}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filteredEntries.length === 0 && tableEntries.length > 0 && (
          <EmptyState
            message={t("noFilterResults")}
            style={{ paddingVertical: inset.group, flex: 0 }}
          />
        )}

        <View
          style={styles.cardsGrid}
          onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
        >
          {filteredEntries.map((entry) => (
            <TableCard
              key={entry.id}
              entry={entry}
              cardWidth={cardWidth}
              now={now}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    stickyHeader: {
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: inset.list,
      gap: inset.list,
    },
    list: {
      gap: inset.list,
      paddingBottom: inset.screenBottom,
    },
    filtersRow: {
      flexDirection: "row",
      gap: inset.tight,
      marginBottom: inset.list,
    },
    cardsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: inset.list,
    },
  });
}
