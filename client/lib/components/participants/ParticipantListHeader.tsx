import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { MenuButton } from "@/lib/components/shell/MenuButton";
import { useTournament } from "@/lib/bootstrap/TournamentProvider";
import { inset, space } from "@/lib/theme/spacing";
import { fonts, type } from "@/lib/theme/typography";

interface Props {
  count: number;
  onMenuPress: () => void;
}

export function ParticipantListHeader({ count, onMenuPress }: Props) {
  const { colors, isDark } = useTheme();
  const { type: tournamentType } = useTournament();
  const { t } = useTranslation(["participants", "home", "menu"]);
  const insets = useSafeAreaInsets();

  const styles = useMemo(() => {
    const background = isDark ? colors.surface : colors.primary;
    const foreground = isDark ? colors.text : colors.onAccent;
    const muted = isDark ? colors.textSecondary : colors.surfaceHigh;

    return StyleSheet.create({
      hero: {
        backgroundColor: background,
        paddingHorizontal: inset.card,
        paddingBottom: space[5],
        gap: space[4],
      },
      titleRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: inset.card,
        paddingHorizontal: space[2],
      },
      titleText: {
        flex: 1,
        minWidth: 0,
        gap: 2,
      },
      eyebrow: {
        ...type.eyebrow,
        color: muted,
      },
      title: {
        ...type.h1,
        color: foreground,
      },
      countBlock: {
        alignItems: "flex-end",
        paddingBottom: space[2],
      },
      count: {
        ...type.h2,
        fontFamily: fonts.displayExtraBold,
        color: foreground,
      },
      countLabel: {
        ...type.caption,
        color: muted,
      },
    });
  }, [colors, isDark]);

  return (
    <View style={[styles.hero, { paddingTop: insets.top + space[2] }]}>
      <MenuButton onPress={onMenuPress} />

      <View style={styles.titleRow}>
        <View style={styles.titleText}>
          <Text style={styles.eyebrow} numberOfLines={1}>
            {t(`menu:${tournamentType}`)}
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {t("participants:title")}
          </Text>
        </View>
        <View style={styles.countBlock}>
          <Text style={styles.count}>{count}</Text>
          <Text style={styles.countLabel}>{t("participants:teamsLabel", { count })}</Text>
        </View>
      </View>
    </View>
  );
}
