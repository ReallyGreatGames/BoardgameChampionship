import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";

type Cell = string | number;
type Column = { key: string; label: string; align?: "left" | "center" | "right" };

type Props = {
  columns: Column[];
  rows: Record<string, Cell>[];
  emptyMessage?: string;
};

export function DataTable({ columns, rows, emptyMessage = "No data" }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView horizontal contentContainerStyle={styles.scroller}>
      <View style={styles.table}>
        <View style={[styles.row, styles.header]}>
          {columns.map((column) => (
            <Text key={column.key} style={[styles.cell, styles.headerCell, { textAlign: column.align }]}>
              {column.label}
            </Text>
          ))}
        </View>
        {rows.length === 0 ? (
          <Text style={styles.empty}>{emptyMessage}</Text>
        ) : (
          rows.map((row, rowIndex) => (
            <View key={String(row.id ?? rowIndex)} style={styles.row}>
              {columns.map((column) => (
                <Text key={column.key} style={[styles.cell, { textAlign: column.align }]} numberOfLines={1}>
                  {row[column.key]}
                </Text>
              ))}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    scroller: { flexGrow: 1 },
    table: {
      flex: 1,
      minWidth: 420,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor: colors.surface,
    },
    row: {
      flexDirection: "row",
      gap: space[2],
      paddingHorizontal: inset.card,
      paddingVertical: space[3],
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
    header: { backgroundColor: colors.surfaceHigh, borderTopWidth: 0 },
    cell: { ...type.bodySmall, color: colors.text, flex: 1, minWidth: 80 },
    headerCell: { ...type.eyebrow, color: colors.textMuted },
    empty: { ...type.bodySmall, color: colors.textMuted, padding: inset.card, textAlign: "center" },
  });
}
