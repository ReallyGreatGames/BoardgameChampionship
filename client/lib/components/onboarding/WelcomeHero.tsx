import { ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { useTournament } from "@/lib/bootstrap/TournamentProvider";
import { MenuButton } from "@/lib/components/shell/MenuButton";
import { inset, space } from "@/lib/theme/spacing";
import { fonts, type } from "@/lib/theme/typography";

const LOGOS: Partial<Record<string, number>> = {
  dmmib: require("../../../assets/images/logo-dmmib.png"),
  europemasters: require("../../../assets/images/logo-europemasters.png"),
};

interface Props {
  onMenuPress: () => void;
  title?: string;
  onTitlePress?: () => void;
  children?: ReactNode;
}

export function WelcomeHero({ onMenuPress, title, onTitlePress, children }: Props) {
  const { colors, isDark } = useTheme();
  const { type: tournamentType } = useTournament();
  const { t } = useTranslation(["home", "menu"]);
  const insets = useSafeAreaInsets();

  const logo = tournamentType ? LOGOS[tournamentType] : undefined;

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
      title: {
        fontFamily: fonts.displayExtraBold,
        fontSize: 48,
        lineHeight: 50,
        letterSpacing: -0.5,
        color: foreground,
      },
    });
  }, [colors, isDark]);

  return (
    <View style={[styles.hero, { paddingTop: insets.top + space[2] }]}>
      <MenuButton onPress={onMenuPress} />

      <View style={styles.identityRow}>
        {logo && <Image source={logo} style={styles.logo} accessibilityIgnoresInvertColors />}
        <View style={styles.identityText}>
          <Text style={styles.eyebrow} numberOfLines={1}>
            {t(`menu:${tournamentType}`)}
          </Text>
          <Pressable onPress={onTitlePress} disabled={!onTitlePress}>
            <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
              {title ?? t("home:welcome")}
            </Text>
          </Pressable>
          {children}
        </View>
      </View>
    </View>
  );
}
