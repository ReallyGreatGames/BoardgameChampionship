import { FeatureFlags } from "@/lib/components/FeatureFlags";
import { ImportTab } from "@/lib/components/ImportTab";
import { RankingsTab } from "@/lib/components/RankingsTab";
import { ResultsAdminTab } from "@/lib/components/ResultsAdminTab";
import { ScheduleList } from "@/lib/components/Schedule";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../../../lib/bootstrap/ThemeProvider";
import { TournamentSettings } from "../../../../lib/components/TournamentSettings";
import { inset, space } from "../../../../lib/theme/spacing";

type Tab = "results" | "rankings" | "schedule" | "tournamentSettings" | "import";

const TABS: { key: Tab }[] = [
  { key: "results" },
  { key: "rankings" },
  { key: "schedule" },
  { key: "tournamentSettings" },
  { key: "import" },
];

export default function AdminDashboard() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["adminDashboard", "components"]);
  const [activeTab, setActiveTab] = useState<Tab>("results");

  return (
    <View style={styles.container}>
      <View style={styles.tabBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
          bounces={false}
        >
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab.key && styles.tabLabelActive,
                ]}
              >
                {t(`tabs.${tab.key}`)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.content}>
        {activeTab === "results" && <ResultsAdminTab />}
        {activeTab === "rankings" && <RankingsTab />}
        {activeTab === "schedule" && <ScheduleList />}
        {activeTab === "tournamentSettings" && (
          <ScrollView
            contentContainerStyle={styles.settingsScroll}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionHeading}>
              {t("components:tournamentSettings.heading")}
            </Text>
            <TournamentSettings />

            <View style={styles.sectionDivider} />

            <Text style={styles.sectionHeading}>
              {t("components:tournamentSettings.featureFlagsHeading")}
            </Text>
            <FeatureFlags />
          </ScrollView>
        )}
        {activeTab === "import" && <ImportTab />}
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
    tabBarWrapper: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tabBar: {
      flexDirection: "row",
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
    settingsScroll: {
      paddingBottom: inset.screenBottom,
    },
    sectionHeading: {
      fontSize: 13,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: colors.accent,
      marginBottom: inset.tight,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: inset.group,
    },
  });
}
