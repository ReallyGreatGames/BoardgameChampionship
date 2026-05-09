import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import { Player } from "../models/player";
import type { Result } from "../models/result";
import type { Table } from "../models/table";
import { inset, space } from "../theme/spacing";
import { type } from "../theme/typography";
import { StateBadge } from "./StateBadge";

const PLAYER_COUNT = 4;

type Props = {
  gameTables: Table[];
  resultForTable: (tableNumber: number) => Result | undefined;
  globalPos: (tableNumber: number) => number;
  onTablePress: (idx: number) => void;
  t: (key: string) => string;
};

export function ScoreTableView({ gameTables, resultForTable, globalPos, onTablePress, t }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView contentContainerStyle={styles.tableList} showsVerticalScrollIndicator={false}>
      <View style={styles.tableHeaderRow}>
        <View style={styles.colTable}>
          <Text style={styles.colHeader}>{t("tableLabel").replace("{n}", "#")}</Text>
        </View>
        {Array.from({ length: PLAYER_COUNT }, (_, i) => (
          <View key={i} style={styles.colPlayer}>
            <Text style={styles.colHeader}>{t("placementLabel").replace("{n}", String(i + 1))}</Text>
          </View>
        ))}
        <View style={styles.colState}>
          <Text style={styles.colHeader}> </Text>
        </View>
      </View>

      {gameTables.map((table, rowIdx) => {
        const result = resultForTable(table.tableNumber);
        const isEven = rowIdx % 2 === 0;
        return (
          <TouchableOpacity
            key={table.$id}
            style={[styles.tableRow, { backgroundColor: isEven ? colors.surface : colors.background }]}
            activeOpacity={0.7}
            onPress={() => onTablePress(rowIdx)}
          >
            <View style={styles.colTable}>
              <Text style={styles.tableNum}>
                {t("globalLabel").replace("{n}", String(globalPos(table.tableNumber)))}
              </Text>
              <Text style={styles.globalNum}>
                {t("tableLabel").replace("{n}", String(table.tableNumber))}
              </Text>
            </View>

            {Array.from({ length: PLAYER_COUNT }, (_, i) => {
              const player: Player | undefined = table.players[i];
              const placement = result?.placements?.[i] ?? "–";
              const score = result?.scores?.[i];
              return (
                <View key={i} style={styles.colPlayer}>
                  <View style={styles.playerScoreRow}>
                    <View style={[styles.placementPill, placement === "–" && styles.placementPillEmpty]}>
                      <Text style={[styles.placementPillText, placement === "–" && styles.placementPillTextEmpty]}>
                        {placement !== "–" ? placement : "–"}
                      </Text>
                    </View>
                    <Text style={styles.playerScore} numberOfLines={1}>
                      {score !== undefined ? String(score) : ""}
                    </Text>
                  </View>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {player ? player.name : "–"}
                  </Text>
                </View>
              );
            })}

            <View style={styles.colState}>
              <StateBadge result={result} t={t} />
              {result?.note ? (
                <Ionicons name="document-text-outline" size={12} color={colors.textMuted} style={{ marginTop: 2 }} />
              ) : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    tableList: { paddingBottom: inset.screenBottom },
    tableHeaderRow: {
      flexDirection: "row",
      paddingHorizontal: inset.card,
      paddingVertical: space[2],
      backgroundColor: colors.surfaceHigh,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    colHeader: { ...type.caption, color: colors.textMuted, fontWeight: "600" },
    tableRow: {
      flexDirection: "row",
      paddingHorizontal: inset.card,
      paddingVertical: space[3],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
      alignItems: "center",
    },
    colTable: { width: 52 },
    colPlayer: { flex: 1, paddingHorizontal: 2 },
    colState: { width: 72, alignItems: "flex-end" },
    tableNum: { ...type.bodySmall, color: colors.text, fontWeight: "600" },
    globalNum: { ...type.caption, color: colors.textMuted },
    playerScoreRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    placementPill: {
      width: 20,
      height: 20,
      borderRadius: 4,
      backgroundColor: colors.primary + "22",
      borderWidth: 1,
      borderColor: colors.primary + "55",
      alignItems: "center",
      justifyContent: "center",
    },
    placementPillEmpty: { backgroundColor: "transparent", borderColor: colors.border },
    placementPillText: { ...type.caption, color: colors.primary, fontWeight: "700" },
    placementPillTextEmpty: { color: colors.textMuted },
    playerScore: { ...type.bodySmall, color: colors.text, fontWeight: "600" },
    playerName: { ...type.caption, color: colors.textMuted },
  });
}
