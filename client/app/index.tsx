import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/bootstrap/ThemeProvider";
import { ActiveScheduleCard } from "../lib/components/ActiveScheduleCard";
import { UpcomingList } from "../lib/components/UpcomingList";
import { WelcomeScreen } from "../lib/components/WelcomeScreen";
import { useRouter } from "../lib/routing/useRouter";
import { useScheduleStore } from "../lib/stores/appwrite/schedule-store";
import { inset } from "../lib/theme/spacing";
import { type } from "../lib/theme/typography";

export default function Index() {
  const { user, loading, isAdmin, isPinVerified } = useAuth();
  const { routeDeterministic, navigate } = useRouter();
  const { colors } = useTheme();
  const { collection } = useScheduleStore();
  const { t } = useTranslation(["home"]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: inset.screen,
      paddingTop: inset.section,
      gap: inset.group,
    },
    sectionLabel: {
      ...type.eyebrow,
      color: colors.textMuted,
      marginBottom: inset.tight,
    },
    noScheduleText: {
      ...type.body,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: inset.section,
    },
  }), [colors]);

  const sortedItems = useMemo(
    () => [...collection].sort((a, b) => a.sortIndex - b.sortIndex),
    [collection],
  );

  const activeItem = useMemo(
    () => sortedItems.find((s) => s.isActive),
    [sortedItems],
  );

  const upcomingItems = useMemo(() => {
    const activeIndex = sortedItems.findIndex((s) => s.isActive);
    const remaining = activeIndex !== -1
      ? sortedItems.slice(activeIndex + 1)
      : sortedItems;
    return remaining.filter((s) => !s.isFinished).slice(0, 3);
  }, [sortedItems]);

  useEffect(() => {
    if (loading) return;
    routeDeterministic();
  }, [user, loading, isAdmin, isPinVerified, routeDeterministic]);

  if (!user) {
    return <WelcomeScreen onLoginPress={() => navigate("/(pages)/login")} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {activeItem && (
        <View>
          <Text style={styles.sectionLabel}>{t("now")}</Text>
          <ActiveScheduleCard item={activeItem} />
        </View>
      )}

      {upcomingItems.length > 0 && (
        <View>
          <Text style={styles.sectionLabel}>{t("upNext")}</Text>
          <UpcomingList items={upcomingItems} />
        </View>
      )}

      {!activeItem && upcomingItems.length === 0 && (
        <Text style={styles.noScheduleText}>{t("noSchedule")}</Text>
      )}
    </ScrollView>
  );
}
