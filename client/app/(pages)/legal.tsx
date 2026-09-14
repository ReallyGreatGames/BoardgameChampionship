import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { useTournament } from "@/lib/bootstrap/TournamentProvider";
import { GameHeader } from "@/lib/components/game/GameHeader";
import { BackButton } from "@/lib/components/ui/BackButton";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { goBackTo } from "@/lib/utils/navigation";
import { useNavigation } from "expo-router";
import { DrawerActions } from "expo-router/react-navigation";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function LegalScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation(["legal", "menu"]);
  const { type: tournamentType } = useTournament();
  const navigation = useNavigation();

  const openMenu = useCallback(
    () => navigation.dispatch(DrawerActions.openDrawer()),
    [navigation],
  );

  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <GameHeader
        title={t("menu:entries.legal")}
        round={null}
        tableNumber={null}
        subtitle={t(`menu:${tournamentType}`)}
        onMenuPress={openMenu}
      />

      <View style={styles.backButton}>
        <BackButton onPress={() => goBackTo("/settings")} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>{t("legal:imprint.title")}</Text>
        <View style={styles.card}>
          <Text style={styles.paragraph}>{t("legal:imprint.body")}</Text>
        </View>

        <Text style={styles.sectionLabel}>{t("legal:privacy.title")}</Text>
        <View style={styles.card}>
          <Text style={styles.paragraph}>{t("legal:privacy.body")}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backButton: {
      paddingHorizontal: inset.card,
      paddingTop: inset.card,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: inset.card,
      paddingTop: space[2],
      paddingBottom: inset.group,
    },
    sectionLabel: {
      ...type.eyebrow,
      color: colors.textSecondary,
      marginBottom: inset.tight,
      marginLeft: 4,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      marginBottom: inset.card,
    },
    paragraph: {
      ...type.body,
      color: colors.textSecondary,
      lineHeight: 22,
    },
  });
}
