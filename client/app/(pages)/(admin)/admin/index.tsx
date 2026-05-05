import { FeatureFlags } from "@/lib/components/FeatureFlags";
import { ImportPlayers } from "@/lib/components/ImportPlayers";
import { ScheduleList } from "@/lib/components/Schedule";
import { TableOverview } from "@/lib/components/TableOverview";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../../../lib/bootstrap/ThemeProvider";
import { TournamentSettings } from "../../../../lib/components/TournamentSettings";
import { inset, space } from "../../../../lib/theme/spacing";

type Tab = "tableOverview" | "schedule" | "tournamentSettings" | "featureFlags" | "import";

const TABS: { key: Tab; label: string }[] = [
  { key: "tableOverview", label: "Table Overview" },
  { key: "schedule", label: "Schedule" },
  { key: "tournamentSettings", label: "Settings" },
  { key: "featureFlags", label: "Feature Flags" },
  { key: "import", label: "Import" },
];

export default function AdminDashboard() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState<Tab>("tableOverview");

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.content}>
        {activeTab === "tableOverview" && <TableOverview />}
        {activeTab === "schedule" && <ScheduleList />}
        {activeTab === "tournamentSettings" && <TournamentSettings />}
        {activeTab === "featureFlags" && <FeatureFlags />}
        {activeTab === "import" && <ImportPlayers />}
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    tabBar: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: inset.screen,
    },
    tab: {
      paddingVertical: space[3],
      paddingHorizontal: space[4],
      marginRight: space[2],
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabActive: {
      borderBottomColor: colors.primary,
    },
    tabLabel: {
      fontSize: 14,
      color: colors.textMuted,
    },
    tabLabelActive: {
      color: colors.primary,
      fontWeight: "600",
    },
    content: {
      flex: 1,
      paddingHorizontal: inset.screen,
      paddingTop: inset.group,
      paddingBottom: inset.screenBottom,
    },
  });
}
