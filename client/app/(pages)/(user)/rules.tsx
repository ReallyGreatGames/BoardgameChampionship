import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { GameHeader } from "@/lib/components/game/GameHeader";
import { BackButton } from "@/lib/components/ui/BackButton";
import { RuleList } from "@/lib/components/rules/RuleList";
import { useGameScheduleInfo } from "@/lib/hooks/useGameScheduleInfo";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useRuleStore } from "@/lib/stores/appwrite/rule-store";
import { inset } from "@/lib/theme/spacing";
import { goBackTo } from "@/lib/utils/navigation";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { DrawerActions } from "expo-router/react-navigation";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

export default function RulesPage() {
  const { gameId, from } = useLocalSearchParams<{ gameId: string; from?: string }>();
  const { user, loading, isAdmin } = useRequireAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["rules"]);
  const navigation = useNavigation();
  const game = useGameScheduleInfo(gameId);
  const ruleCount = useRuleStore(
    (state) => state.collection.filter((rule) => rule.gameId === gameId).length,
  );

  const openMenu = useCallback(
    () => navigation.dispatch(DrawerActions.openDrawer()),
    [navigation],
  );

  const handleBack = () => {
    goBackTo(from ?? (gameId ? `/game?gameId=${gameId}` : "/"));
  };

  if (loading || !user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <GameHeader
        title={game.title || t("title")}
        round={null}
        tableNumber={null}
        subtitle={t("additionalRuleCount", { count: ruleCount })}
        onMenuPress={openMenu}
      />

      <View style={styles.body}>
        <View style={styles.backButton}>
          <BackButton onPress={handleBack} />
        </View>

        <RuleList gameId={gameId ?? ""} isAdmin={isAdmin} />
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    backButton: {
      paddingBottom: inset.card,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    body: {
      flex: 1,
      paddingHorizontal: inset.card,
      paddingTop: inset.card,
    },
  });
}
