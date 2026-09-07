import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
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
      menuRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: space[2],
      },
      menuButton: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        borderRadius: 10,
      },
      menuButtonPressed: {
        opacity: 0.6,
      },
      menuBar: {
        width: 20,
        height: 2,
        borderRadius: 1,
        backgroundColor: foreground,
      },
      menuBarShort: {
        width: 14,
        height: 2,
        borderRadius: 1,
        backgroundColor: muted,
      },
      menuLabel: {
        ...type.caption,
        color: muted,
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
      <View style={styles.menuRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("home:openMenu")}
          onPress={onMenuPress}
          style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
        >
          <View style={styles.menuBar} />
          <View style={styles.menuBar} />
          <View style={styles.menuBarShort} />
        </Pressable>
        <Text style={styles.menuLabel}>{t("home:openMenu")}</Text>
      </View>

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
