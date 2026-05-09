import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import { space } from "../theme/spacing";
import { type } from "../theme/typography";
import { ImportPlayers } from "./ImportPlayers";
import { ImportTables } from "./ImportTables";

type SubTab = "players" | "tables";

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: "players", label: "Players & Teams" },
  { key: "tables", label: "Table Seating" },
];

export function ImportTab() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [active, setActive] = useState<SubTab>("players");

  return (
    <View style={styles.container}>
      <View style={styles.subTabBar}>
        {SUB_TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.subTab, active === tab.key && styles.subTabActive]}
            onPress={() => setActive(tab.key)}
          >
            <Text
              style={[
                styles.subTabLabel,
                active === tab.key && styles.subTabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.content}>
        {active === "players" && <ImportPlayers />}
        {active === "tables" && <ImportTables />}
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    subTabBar: {
      flexDirection: "row",
      gap: space[1],
      marginBottom: space[4],
    },
    subTab: {
      paddingVertical: space[2],
      paddingHorizontal: space[4],
      borderRadius: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    subTabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    subTabLabel: {
      ...type.bodySmall,
      color: colors.textSecondary,
    },
    subTabLabelActive: {
      color: colors.onAccent,
      fontWeight: "600",
    },
    content: {
      flex: 1,
    },
  });
}
