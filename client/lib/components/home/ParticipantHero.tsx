import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlayer } from "@/lib/bootstrap/PlayerProvider";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { useTournament } from "@/lib/bootstrap/TournamentProvider";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { teamName } from "@/lib/utils";

const LOGOS: Partial<Record<string, number>> = {
  dmmib: require("../../../assets/images/logo-dmmib.png"),
  europemasters: require("../../../assets/images/logo-europemasters.png"),
};

interface Props {
  onMenuPress: () => void;
}

export function ParticipantHero({ onMenuPress }: Props) {
  const { colors, isDark } = useTheme();
  const { player } = usePlayer();
  const { type: tournamentType } = useTournament();
  const { t } = useTranslation(["home", "menu"]);
  const insets = useSafeAreaInsets();

  const logo = tournamentType ? LOGOS[tournamentType] : undefined;
  const firstName = player?.name?.trim().split(/\s+/)[0] ?? "";
  const team = player ? teamName(player) : "";

  const styles = useMemo(() => {
    const background = isDark ? colors.surface : colors.primary;
    const foreground = isDark ? colors.text : colors.onAccent;
    const muted = isDark ? colors.textSecondary : colors.surfaceHigh;

    return StyleSheet.create({
      hero: {
        backgroundColor: background,
        paddingHorizontal: inset.card,
        paddingBottom: space[6],
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
      identityRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: inset.card,
        paddingHorizontal: space[2],
      },
      logo: {
        width: 84,
        height: 84,
        resizeMode: "contain",
      },
      identityText: {
        flex: 1,
        minWidth: 0,
        gap: 2,
      },
      eyebrow: {
        ...type.eyebrow,
        color: muted,
      },
      greeting: {
        ...type.h1,
        color: foreground,
      },
      team: {
        ...type.body,
        color: muted,
      },
    });
  }, [colors, isDark]);

  return (
    <View style={[styles.hero, { paddingTop: insets.top + space[2] }]}>
      <View style={styles.menuRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("openMenu")}
          onPress={onMenuPress}
          style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
        >
          <View style={styles.menuBar} />
          <View style={styles.menuBar} />
          <View style={styles.menuBarShort} />
        </Pressable>
        <Text style={styles.menuLabel}>{t("openMenu")}</Text>
      </View>

      <View style={styles.identityRow}>
        {logo && <Image source={logo} style={styles.logo} accessibilityIgnoresInvertColors />}
        <View style={styles.identityText}>
          <Text style={styles.eyebrow} numberOfLines={1}>
            {t(`menu:${tournamentType}`)}
          </Text>
          <Text style={styles.greeting} numberOfLines={1}>
            {firstName ? t("greeting", { name: firstName }) : t("welcome")}
          </Text>
          {!!team && (
            <Text style={styles.team} numberOfLines={1}>
              {team}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
