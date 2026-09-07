import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { MenuButton } from "@/lib/components/shell/MenuButton";
import { inset, space } from "@/lib/theme/spacing";
import { fonts, type } from "@/lib/theme/typography";

interface Props {
  title: string;
  round: number | null;
  tableNumber: number | null;
  subtitle?: string;
  onMenuPress: () => void;
}

export function GameHeader({
  title,
  round,
  tableNumber,
  subtitle,
  onMenuPress,
}: Props) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation(["game", "home"]);
  const insets = useSafeAreaInsets();

  const foreground = isDark ? colors.text : colors.onAccent;
  const muted = isDark ? colors.textSecondary : colors.surfaceHigh;

  const styles = useMemo(() => {
    const background = isDark ? colors.surface : colors.primary;

    return StyleSheet.create({
      hero: {
        backgroundColor: background,
        paddingHorizontal: inset.card,
        paddingBottom: space[5],
        gap: space[3],
      },
      titleBlock: {
        minWidth: 0,
        gap: 2,
        paddingHorizontal: space[2],
      },
      title: {
        fontFamily: fonts.displayExtraBold,
        fontSize: 34,
        lineHeight: 38,
        letterSpacing: -0.2,
        color: foreground,
      },
      meta: {
        ...type.caption,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        color: muted,
      },
    });
  }, [colors, isDark, foreground, muted]);

  const meta =
    subtitle ??
    [
      round !== null ? t("home:round", { round }) : null,
      tableNumber !== null
        ? t("home:table", { table: tableNumber })
        : t("home:tableToBeAnnounced"),
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <View style={[styles.hero, { paddingTop: insets.top + space[2] }]}>
      <MenuButton onPress={onMenuPress} />

      <View style={styles.titleBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {title || t("game:title")}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
      </View>
    </View>
  );
}
