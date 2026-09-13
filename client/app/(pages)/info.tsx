import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { useTournament } from "@/lib/bootstrap/TournamentProvider";
import { GameHeader } from "@/lib/components/game/GameHeader";
import { BackButton } from "@/lib/components/ui/BackButton";
import { inset, space } from "@/lib/theme/spacing";
import { fonts, type } from "@/lib/theme/typography";
import { goBackTo } from "@/lib/utils/navigation";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { DrawerActions } from "expo-router/react-navigation";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type FaqEntry = { q: string; a: string };

export default function InfoScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation(["info", "menu"]);
  const { type: tournamentType } = useTournament();
  const navigation = useNavigation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const entries = t("info:faq", { returnObjects: true }) as FaqEntry[];

  const openMenu = useCallback(
    () => navigation.dispatch(DrawerActions.openDrawer()),
    [navigation],
  );

  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <GameHeader
        title={t("menu:entries.info")}
        round={null}
        tableNumber={null}
        subtitle={t(`menu:${tournamentType}`)}
        onMenuPress={openMenu}
      />

      <View style={styles.backButton}>
        <BackButton onPress={() => goBackTo("/")} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {entries.map((entry, i) => {
          const open = openIndex === i;
          return (
            <View key={i} style={styles.item}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                style={({ pressed }) => [
                  styles.header,
                  pressed && styles.headerPressed,
                ]}
                onPress={() => setOpenIndex(open ? null : i)}
              >
                <Text style={styles.question}>{entry.q}</Text>
                <Ionicons
                  name={open ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.textMuted}
                />
              </Pressable>
              {open && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.answer}>{entry.a}</Text>
                </>
              )}
            </View>
          );
        })}
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
      gap: space[2] + 2,
    },
    item: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 44,
      paddingVertical: 14,
      paddingHorizontal: inset.card,
      gap: space[3],
    },
    headerPressed: {
      backgroundColor: colors.surfaceHigh,
    },
    question: {
      ...type.body,
      fontFamily: fonts.bodyMedium,
      color: colors.text,
      flex: 1,
    },
    divider: {
      height: 1,
      backgroundColor: colors.divider,
    },
    answer: {
      ...type.body,
      color: colors.textSecondary,
      padding: inset.card,
      paddingTop: space[3],
    },
  });
}
