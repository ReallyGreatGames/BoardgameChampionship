import { DrawerActions } from "expo-router/react-navigation";
import { useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/bootstrap/ThemeProvider";
import { ActiveScheduleCard } from "@/lib/components/schedule/ActiveScheduleCard";
import { NowPlayingCard } from "@/lib/components/home/NowPlayingCard";
import { ParticipantHero } from "@/lib/components/home/ParticipantHero";
import { PlayerGameList } from "@/lib/components/home/PlayerGameList";
import { PlayerScoreSummary } from "@/lib/components/home/PlayerScoreSummary";
import { UpcomingList } from "@/lib/components/schedule/UpcomingList";
import { WelcomeScreen } from "@/lib/components/onboarding/WelcomeScreen";
import { useParticipantOverview } from "@/lib/hooks/useParticipantOverview";
import { useRouter } from "../lib/routing/useRouter";
import { useScheduleStore } from "../lib/stores/appwrite/schedule-store";
import { inset, space } from "../lib/theme/spacing";
import { type } from "../lib/theme/typography";

export default function Index() {
  const { user, loading, isAdmin, isPinVerified } = useAuth();
  const { routeDeterministic, navigate } = useRouter();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { collection } = useScheduleStore();
  const { t } = useTranslation(["home"]);
  const { activeItem, currentMatch, entries, totalPoints, playedCount, totalCount } =
    useParticipantOverview();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          padding: inset.card,
          paddingBottom: inset.screenBottom,
          gap: space[5],
        },
        section: {
          gap: inset.tight,
        },
        sectionLabel: {
          ...type.eyebrow,
          color: colors.textMuted,
        },
        resultsSection: {
          gap: inset.list,
        },
        noScheduleText: {
          ...type.body,
          color: colors.textMuted,
          textAlign: "center",
          marginTop: inset.section,
        },
      }),
    [colors],
  );

  const openMenu = useCallback(
    () => navigation.dispatch(DrawerActions.openDrawer()),
    [navigation],
  );

  const upcomingItems = useMemo(() => {
    const sortedItems = [...collection].sort((a, b) => a.sortIndex - b.sortIndex);
    const activeIndex = sortedItems.findIndex((s) => s.isActive);
    const remaining =
      activeIndex !== -1 ? sortedItems.slice(activeIndex + 1) : sortedItems;
    return remaining.filter((s) => !s.isFinished).slice(0, 3);
  }, [collection]);

  useEffect(() => {
    if (loading) {
      return;
    }
    routeDeterministic();
  }, [user, loading, isAdmin, isPinVerified, routeDeterministic]);

  useEffect(() => {
    navigation.setOptions({ headerShown: !user });
  }, [navigation, user]);

  if (!user) {
    return (
      <WelcomeScreen
        onLoginPress={() => navigate("/(pages)/login")}
        onFaqPress={() => navigate("/(pages)/info")}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ParticipantHero onMenuPress={openMenu} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {currentMatch && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t("nowPlaying")}</Text>
            <NowPlayingCard match={currentMatch} />
          </View>
        )}

        {!currentMatch && activeItem && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t("now")}</Text>
            <ActiveScheduleCard item={activeItem} />
          </View>
        )}

        {!currentMatch && upcomingItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t("upNext")}</Text>
            <UpcomingList items={upcomingItems} />
          </View>
        )}

        {entries.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionLabel}>{t("myResults")}</Text>
            <PlayerScoreSummary
              entries={entries}
              totalPoints={totalPoints}
              playedCount={playedCount}
              totalCount={totalCount}
            />
            <PlayerGameList entries={entries} />
          </View>
        )}

        {!activeItem && upcomingItems.length === 0 && entries.length === 0 && (
          <Text style={styles.noScheduleText}>{t("noSchedule")}</Text>
        )}
      </ScrollView>
    </View>
  );
}
