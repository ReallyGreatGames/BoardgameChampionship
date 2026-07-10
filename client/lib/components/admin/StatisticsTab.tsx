import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { Combobox } from "@/lib/components/ui/Combobox";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { InfoButton } from "@/lib/components/ui/InfoButton";
import { SeatCard } from "@/lib/components/statistics/SeatCard";
import { TeamPerformanceTable } from "@/lib/components/statistics/TeamPerformanceTable";
import { useResultStore } from "@/lib/stores/appwrite/result-store";
import { useScheduleStore } from "@/lib/stores/appwrite/schedule-store";
import { useTableStore } from "@/lib/stores/appwrite/table-store";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { computeSeatStats, computeTeamSeatPerformance } from "@/lib/utils/statistics";

export function StatisticsTab() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["statistics"]);

  const { collection: schedules } = useScheduleStore();
  const { collection: results } = useResultStore();
  const tables = useTableStore((s) => s.collection);

  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  const gameSchedules = useMemo(
    () => [...schedules].filter((s) => !!s.gameId).sort((a, b) => a.sortIndex - b.sortIndex),
    [schedules],
  );

  const games = useMemo(() => {
    const seen = new Map<string, { gameId: string; gameName: string; isActive: boolean }>();
    for (const s of gameSchedules) {
      const existing = seen.get(s.gameId!);
      if (existing) {
        existing.isActive = existing.isActive || !!s.isActive;
        continue;
      }
      seen.set(s.gameId!, { gameId: s.gameId!, gameName: s.title, isActive: !!s.isActive });
    }
    return Array.from(seen.values());
  }, [gameSchedules]);

  const defaultGameId = useMemo(() => {
    const active = gameSchedules.find((s) => s.isActive);
    if (active) {
      return active.gameId!;
    }
    const nextUp = gameSchedules.find((s) => !s.isFinished);
    if (nextUp) {
      return nextUp.gameId!;
    }
    return gameSchedules[gameSchedules.length - 1]?.gameId ?? null;
  }, [gameSchedules]);

  const gameStatsList = useMemo(
    () =>
      games.map((g) => {
        const seatStats = computeSeatStats(results, g.gameId);
        return {
          gameId: g.gameId,
          gameName: g.gameName,
          matches: seatStats[0]?.matches ?? 0,
          seatStats,
        };
      }),
    [games, results],
  );

  useEffect(() => {
    if (selectedGameId === null && defaultGameId !== null) {
      setSelectedGameId(defaultGameId);
    }
  }, [defaultGameId, selectedGameId]);

  const selected = gameStatsList.find((g) => g.gameId === selectedGameId) ?? null;

  const teamPerformance = useMemo(() => {
    if (!selected) {
      return [];
    }
    return computeTeamSeatPerformance(results, tables, selected.gameId, selected.seatStats);
  }, [results, tables, selected]);

  if (games.length === 0) {
    return <EmptyState message={t("noGames")} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      <View style={styles.detailHeaderRow}>
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionHeading}>{t("detailHeading")}</Text>
          <InfoButton title={t("detailHeading")} message={t("infoSeatDetails")} />
        </View>
        <Combobox
          value={selectedGameId ?? ""}
          options={games.map((g) => ({ value: g.gameId, label: g.gameName, isLive: g.isActive }))}
          onChange={setSelectedGameId}
        />
      </View>

      {selected && selected.matches === 0 ? (
        <EmptyState message={t("noData")} style={{ paddingVertical: inset.group, flex: 0 }} />
      ) : selected ? (
        <>
          <Text style={styles.matchCount}>{t("matchesCount", { count: selected.matches })}</Text>

          <View style={styles.seatList}>
            {selected.seatStats.map((s) => (
              <SeatCard key={s.seat} seat={s} />
            ))}
          </View>

          <View style={styles.sectionDivider} />

          <TeamPerformanceTable teamPerformance={teamPerformance} />
        </>
      ) : null}
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    list: {
      gap: space[2],
      paddingBottom: inset.screenBottom,
    },
    sectionHeading: {
      fontSize: 13,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: colors.accent,
    },
    sectionHeadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: inset.group,
    },
    detailHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: space[2],
    },
    matchCount: {
      ...type.caption,
      color: colors.textMuted,
      marginTop: -space[1],
    },
    seatList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: space[2],
      marginTop: space[2],
    },
  });
}
