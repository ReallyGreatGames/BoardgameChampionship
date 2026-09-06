import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { BackButton } from "@/lib/components/ui/BackButton";
import { RuleList } from "@/lib/components/rules/RuleList";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { inset } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { goBackTo } from "@/lib/utils/navigation";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

export default function RulesPage() {
  const { gameId, from } = useLocalSearchParams<{ gameId: string; from?: string }>();
  const { user, loading, isAdmin } = useRequireAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handleBack = () => {
    goBackTo(from ?? (gameId ? `/game?gameId=${gameId}` : "/"));
  };

  if (loading || !user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.backButton}>
        <BackButton onPress={handleBack} />
      </View>

      <RuleList gameId={gameId ?? ""} isAdmin={isAdmin} />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    backButton: {
      paddingBottom: inset.group,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: inset.screen,
      paddingTop: inset.group,
    },
    header: {
      marginBottom: inset.list,
    },
    title: {
      ...type.h1,
      color: colors.text,
    },
  });
}
