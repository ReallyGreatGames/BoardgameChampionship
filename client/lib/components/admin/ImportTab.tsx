import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { ImportPlayers } from "@/lib/components/admin/ImportPlayers";
import { ImportTables } from "@/lib/components/admin/ImportTables";
import { ImportRules } from "@/lib/components/admin/ImportRules";
import { useImportActivity } from "@/lib/components/admin/ImportActivityContext";

type SubTab = "players" | "tables" | "rules";

const SUB_TABS: { key: SubTab; labelKey: string }[] = [
  { key: "players", labelKey: "subTabs.players" },
  { key: "tables", labelKey: "subTabs.tables" },
  { key: "rules", labelKey: "subTabs.rules" },
];

export function ImportTab() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["importTab"]);
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
                {t(tab.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.content}>
        {active === "players" && <ImportPlayers />}
        {active === "tables" && <ImportTables />}
        {active === "rules" && <ImportRules />}
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
