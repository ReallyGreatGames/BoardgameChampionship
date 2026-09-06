import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { LotteryOption, OptionsLottery } from "@/lib/models/options-lottery";
import { useOptionsLotteryStore } from "@/lib/stores/appwrite/options-lottery-store";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { ui } from "@/lib/theme/ui";
import { getOptionsLotteriesForGame } from "@/lib/utils/options-lottery";
import { goBackTo, redirectTo } from "@/lib/utils/navigation";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

function resolveResultDisplay(
  instance: OptionsLottery,
  optionIds: string[],
): { titles: string; descriptions: string } {
  const pulled: (LotteryOption | undefined)[] = optionIds.map((id) =>
    instance.options.find((o) => o.id === id),
  );
  const titles = pulled.map((o) => o?.title ?? "?").join(", ");
  const descriptions = pulled
    .map((o) => o?.description)
    .filter((d): d is string => !!d)
    .join(" · ");
  return { titles, descriptions };
}

type TableCard = {
  table: number;
  titles: string;
  descriptions: string;
};

export default function LotteryResultsScreen() {
  useRequireAuth();
  const { gameId, from } = useLocalSearchParams<{ gameId: string; from?: string }>();
  const { isAdmin } = useAuth();
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const numColumns = screenWidth < ui.breakpointTablet ? 2 : screenWidth < 1100 ? 3 : 4;
  const gridGap = space[3];
  const contentWidth = screenWidth - inset.screen * 2;
  const cardWidth = (contentWidth - gridGap * (numColumns - 1)) / numColumns;
  const styles = useMemo(() => makeStyles(colors, cardWidth), [colors, cardWidth]);
  const { t } = useTranslation(["lotteryOptions"]);
  const { t: tMenu } = useTranslation(["menu"]);
  const rows = useOptionsLotteryStore((s) => s.collection);

  const pulledInstances = useMemo(
    () =>
      getOptionsLotteriesForGame(rows, gameId).filter((instance) => instance.results.length > 0),
    [rows, gameId],
  );

  const sharedInstances = useMemo(
    () => pulledInstances.filter((instance) => instance.sameForAllTables),
    [pulledInstances],
  );

  const tableCards = useMemo(() => {
    const perTableInstances = pulledInstances.filter((instance) => !instance.sameForAllTables);
    const byTable = new Map<number, { titles: string[]; descriptions: string[] }>();
    for (const instance of perTableInstances) {
      for (const result of instance.results) {
        const { titles, descriptions } = resolveResultDisplay(instance, result.optionIds);
        const entry = byTable.get(result.table) ?? { titles: [], descriptions: [] };
        if (titles) {
          entry.titles.push(titles);
        }
        if (descriptions) {
          entry.descriptions.push(descriptions);
        }
        byTable.set(result.table, entry);
      }
    }
    const cards: TableCard[] = Array.from(byTable.entries()).map(([table, entry]) => ({
      table,
      titles: entry.titles.join(", "),
      descriptions: entry.descriptions.join(" · "),
    }));
    return cards.sort((a, b) => a.table - b.table);
  }, [pulledInstances]);

  const handleClose = () =>
    goBackTo(from ?? `/(pages)/(user)/lottery?gameId=${gameId}`);

  if (!isAdmin) {
    redirectTo(`/(pages)/(user)/lottery?gameId=${gameId}`);
    return null;
  }

  const isEmpty = sharedInstances.length === 0 && tableCards.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {tMenu("entries.lotteryResults")}
        </Text>
        <Pressable style={styles.closeBtn} onPress={handleClose} hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
      </View>

      {isEmpty ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.empty}>{t("notPulledYet")}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {sharedInstances.length > 0 && (
            <View style={styles.sharedSection}>
              {sharedInstances.map((instance) => {
                const { titles, descriptions } = resolveResultDisplay(
                  instance,
                  instance.results[0].optionIds,
                );
                return (
                  <View key={instance.$id} style={styles.sharedBlock}>
                    <Text style={styles.sharedLabel}>{instance.name}</Text>
                    <Text style={styles.sharedTitle}>{titles}</Text>
                    {descriptions ? (
                      <Text style={styles.sharedDescription}>{descriptions}</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}

          {tableCards.length > 0 && (
            <View style={styles.grid}>
              {tableCards.map((card) => (
                <View key={card.table} style={styles.card}>
                  <View style={styles.tableBadge}>
                    <Text style={styles.tableNumber}>{card.table}</Text>
                  </View>
                  <View style={styles.body}>
                    <Text style={styles.resultTitle} numberOfLines={2}>
                      {card.titles}
                    </Text>
                    {card.descriptions ? (
                      <Text style={styles.resultDescription} numberOfLines={2}>
                        {card.descriptions}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"], cardWidth: number) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: inset.screen,
      paddingTop: inset.screenTop,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: inset.card,
    },
    title: {
      ...type.h1,
      color: colors.text,
      flex: 1,
      marginRight: inset.tight,
    },
    closeBtn: {
      padding: 4,
    },
    emptyWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    empty: {
      ...type.body,
      color: colors.textMuted,
    },
    scrollContent: {
      gap: inset.section,
      paddingBottom: inset.screenBottom,
    },
    sharedSection: {
      gap: inset.section,
    },
    sharedBlock: {
      alignItems: "center",
      gap: inset.tight,
    },
    sharedLabel: {
      ...type.eyebrow,
      color: colors.textMuted,
    },
    sharedTitle: {
      ...type.display,
      color: colors.text,
      textAlign: "center",
    },
    sharedDescription: {
      ...type.h2,
      color: colors.textSecondary,
      textAlign: "center",
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: space[3],
    },
    card: {
      width: cardWidth,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: inset.tight,
      gap: 10,
    },
    tableBadge: {
      backgroundColor: colors.accent,
      borderRadius: 8,
      minWidth: 56,
      paddingVertical: 8,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "stretch",
    },
    tableNumber: {
      fontFamily: type.h2.fontFamily,
      fontSize: 30,
      lineHeight: 34,
      color: colors.onAccent,
    },
    body: {
      flex: 1,
      gap: 4,
    },
    resultTitle: {
      ...type.h3,
      color: colors.text,
    },
    resultDescription: {
      ...type.bodySmall,
      color: colors.textSecondary,
    },
  });
}
