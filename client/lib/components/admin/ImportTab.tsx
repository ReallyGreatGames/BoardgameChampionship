import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { ImportPlayers } from "@/lib/components/admin/ImportPlayers";
import { ImportTables } from "@/lib/components/admin/ImportTables";
import { useImportActivity } from "@/lib/components/admin/ImportActivityContext";

type SubTab = "players" | "tables";

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: "players", label: "Players & Teams" },
  { key: "tables", label: "Table Seating" },
];

export function ImportTab() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [active, setActive] = useState<SubTab>("players");
  const { busy } = useImportActivity();

  return (
    <View style={styles.container}>
      <View style={styles.subTabBar}>
        {SUB_TABS.map((tab) => {
          const disabled = busy && active !== tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[
                styles.subTab,
                active === tab.key && styles.subTabActive,
                disabled && styles.subTabDisabled,
              ]}
              onPress={() => setActive(tab.key)}
              disabled={disabled}
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
          );
        })}
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
    subTabDisabled: {
      opacity: 0.35,
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
