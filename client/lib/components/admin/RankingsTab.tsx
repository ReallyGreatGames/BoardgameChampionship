import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { useResultStore } from "@/lib/stores/appwrite/result-store";
import { useScheduleStore } from "@/lib/stores/appwrite/schedule-store";
import { useTableStore } from "@/lib/stores/appwrite/table-store";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { computeTablePoints, rankTeams, TeamRanking } from "@/lib/utils/placements";
import { resolveGameId } from "@/lib/utils";
import { EmptyState } from "@/lib/components/ui/EmptyState";

const RANK_COLORS = ["#F59E0B", "#9CA3AF", "#B45309"];

function MedalIcon({ rank }: { rank: number }) {
  const { colors } = useTheme();
  if (rank === 1) return <Ionicons name="trophy" size={16} color={RANK_COLORS[0]} />;
  if (rank === 2) return <Ionicons name="medal-outline" size={16} color={RANK_COLORS[1]} />;
  if (rank === 3) return <Ionicons name="medal-outline" size={16} color={RANK_COLORS[2]} />;
  return (
    <Text style={{ ...type.bodySmall, color: colors.textMuted, width: 16, textAlign: "center", fontWeight: "700" }}>
      {rank}
    </Text>
  );
}

export function RankingsTab() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["rankings"]);

  const { collection: schedules } = useScheduleStore();
  const { collection: results } = useResultStore();
  const tables = useTableStore((s) => s.collection);

  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  // Collect all game IDs with results
  const gameSchedules = useMemo(
    () =>
      [...schedules]
        .filter((s) => !!s.gameId)
        .sort((a, b) => a.sortIndex - b.sortIndex),
    [schedules],
  );

  const totalTables = tables.length;
  const submittedResults = results.filter((r) => r.submitted);
  const isComplete = submittedResults.length >= totalTables && totalTables > 0;

  // Aggregate: for each player (identified by table+seat), accumulate points
  const rankings = useMemo<TeamRanking[]>(() => {
    // Build player-stat map: key = playerId ($id), accumulates tournamentPoints + placements
    type Acc = {
      playerId: string;
      playerName: string;
      teamId: string;
      teamName: string;
      teamCode: string;
      tournamentPoints: number;
      placements: number[];
    };

    const playerMap = new Map<string, Acc>();
    const teamMeta = new Map<string, { name: string; code: string }>();

    for (const result of results) {
      if (!result.placements || !result.placements.length) continue;
      const tableEntry = tables.find(
        (tbl) => resolveGameId(tbl.game) === result.gameId && tbl.tableNumber === result.table,
      );
      if (!tableEntry) continue;

      const pts = computeTablePoints(result.placements);

      for (let seat = 0; seat < tableEntry.players.length; seat++) {
        const player = tableEntry.players[seat];
        if (!player) continue;

        const team = player.team;
        const teamId = team.$id;
        teamMeta.set(teamId, { name: team.name, code: team.code });

        const key = player.$id;
        if (!playerMap.has(key)) {
          playerMap.set(key, {
            playerId: player.$id,
            playerName: player.name,
            teamId,
            teamName: team.name,
            teamCode: team.code,
            tournamentPoints: 0,
            placements: [],
          });
        }
        const acc = playerMap.get(key)!;
        const seatPts = pts[seat];
        if (seatPts !== null) acc.tournamentPoints += seatPts;
        const place = Number(result.placements[seat]);
        if (!isNaN(place)) acc.placements.push(place);
      }
    }

    const allTeams = Array.from(teamMeta.entries()).map(([id, meta]) => ({
      id,
      name: meta.name,
      code: meta.code,
    }));

    if (allTeams.length === 0) return [];

    return rankTeams(Array.from(playerMap.values()), allTeams);
  }, [results, tables]);

  if (gameSchedules.length === 0) {
    return <EmptyState message={t("noGames")} />;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    >
      {/* Status banner */}
      <View style={[styles.statusBanner, isComplete ? styles.statusComplete : styles.statusIncomplete]}>
        <Ionicons
          name={isComplete ? "checkmark-circle-outline" : "hourglass-outline"}
          size={15}
          color={isComplete ? colors.success : colors.accent}
        />
        <Text style={[styles.statusText, { color: isComplete ? colors.success : colors.accent }]}>
          {isComplete
            ? t("statusComplete")
            : t("statusIncomplete")
                .replace("{done}", String(submittedResults.length))
                .replace("{total}", String(totalTables))}
        </Text>
      </View>

      {/* Column headers */}
      <View style={styles.headerRow}>
        <View style={styles.colRank} />
        <Text style={[styles.colHeader, styles.colTeam]}>{t("colTeam")}</Text>
        <Text style={[styles.colHeader, styles.colPoints]}>{t("colPoints")}</Text>
        <Text style={[styles.colHeader, styles.colAvg]}>{t("colAvg")}</Text>
      </View>

      {rankings.length === 0 ? (
        <EmptyState message={t("noData")} style={{ paddingVertical: inset.group, flex: 0 }} />
      ) : (
        rankings.map((team) => {
          const isExpanded = expandedTeam === team.teamId;
          const isTop3 = team.rank <= 3;
          return (
            <View key={team.teamId} style={styles.teamBlock}>
              <TouchableOpacity
                style={[styles.teamRow, isTop3 && styles.teamRowTop]}
                onPress={() => setExpandedTeam(isExpanded ? null : team.teamId)}
                activeOpacity={0.8}
              >
                <View style={styles.colRank}>
                  <MedalIcon rank={team.rank} />
                </View>
                <View style={styles.colTeam}>
                  <Text style={styles.teamName} numberOfLines={1}>{team.teamName}</Text>
                  <Text style={styles.teamCode}>{team.teamCode}</Text>
                </View>
                <Text style={[styles.colPoints, styles.pointsValue]}>
                  {team.totalPoints % 1 === 0
                    ? team.totalPoints.toFixed(0)
                    : team.totalPoints.toFixed(1)}
                </Text>
                <Text style={[styles.colAvg, styles.statValue]}>
                  {team.avgPlacement < 999 ? team.avgPlacement.toFixed(2) : "–"}
                </Text>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={14}
                  color={colors.textMuted}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.playersSection}>
                  <View style={styles.playersHeader}>
                    <Text style={styles.playerHeaderCell}>{t("playerName")}</Text>
                    <Text style={styles.playerHeaderPoints}>{t("colPoints")}</Text>
                    <Text style={styles.playerHeaderAvg}>{t("colAvg")}</Text>
                  </View>
                  {team.players
                    .sort((a, b) => b.tournamentPoints - a.tournamentPoints)
                    .map((player) => {
                      const avg =
                        player.placements.length > 0
                          ? (player.placements.reduce((s, p) => s + p, 0) / player.placements.length).toFixed(2)
                          : "–";
                      const pts =
                        player.tournamentPoints % 1 === 0
                          ? player.tournamentPoints.toFixed(0)
                          : player.tournamentPoints.toFixed(1);
                      return (
                        <View key={player.playerId} style={styles.playerRow}>
                          <Text style={styles.playerName} numberOfLines={1}>
                            {player.playerName}
                          </Text>
                          <Text style={styles.playerPoints}>{pts}</Text>
                          <Text style={styles.playerAvg}>{avg}</Text>
                        </View>
                      );
                    })}
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    list: {
      gap: space[1],
      paddingBottom: inset.screenBottom,
    },
    statusBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[2],
      borderRadius: 8,
      paddingHorizontal: inset.card,
      paddingVertical: 8,
      marginBottom: space[2],
      borderWidth: 1,
    },
    statusComplete: {
      backgroundColor: colors.success + "18",
      borderColor: colors.success + "40",
    },
    statusIncomplete: {
      backgroundColor: colors.accent + "18",
      borderColor: colors.accent + "40",
    },
    statusText: {
      ...type.bodySmall,
      fontWeight: "600",
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: inset.card,
      paddingVertical: space[2],
      backgroundColor: colors.surfaceHigh,
      borderRadius: 6,
      gap: space[2],
    },
    colHeader: {
      ...type.caption,
      color: colors.textMuted,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    colRank: { width: 24, alignItems: "center" },
    colTeam: { flex: 1 },
    colPoints: { width: 52, textAlign: "right" },
    colAvg: { width: 44, textAlign: "right" },
    teamBlock: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      overflow: "hidden",
    },
    teamRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: inset.card,
      paddingVertical: 12,
      gap: space[2],
    },
    teamRowTop: {
      backgroundColor: colors.surfaceHigh,
    },
    teamName: {
      ...type.bodySmall,
      color: colors.text,
      fontWeight: "700",
    },
    teamCode: {
      ...type.caption,
      color: colors.textMuted,
    },
    pointsValue: {
      ...type.body,
      color: colors.text,
      fontWeight: "700",
      textAlign: "right",
    },
    statValue: {
      ...type.bodySmall,
      color: colors.textSecondary,
      textAlign: "right",
    },
    playersSection: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    playersHeader: {
      flexDirection: "row",
      paddingHorizontal: inset.card,
      paddingVertical: space[2],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: space[2],
    },
    playerHeaderCell: {
      ...type.caption,
      color: colors.textMuted,
      flex: 1,
      fontWeight: "600",
    },
    playerHeaderPoints: {
      ...type.caption,
      color: colors.textMuted,
      width: 52,
      textAlign: "right",
      fontWeight: "600",
    },
    playerHeaderAvg: {
      ...type.caption,
      color: colors.textMuted,
      width: 44,
      textAlign: "right",
      fontWeight: "600",
    },
    playerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: inset.card,
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
      gap: space[2],
    },
    playerName: {
      ...type.bodySmall,
      color: colors.text,
      flex: 1,
    },
    playerPoints: {
      ...type.bodySmall,
      color: colors.text,
      fontWeight: "600",
      width: 52,
      textAlign: "right",
    },
    playerAvg: {
      ...type.caption,
      color: colors.textMuted,
      width: 44,
      textAlign: "right",
    },
  });
}
