import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { MenuButton } from "@/lib/components/shell/MenuButton";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";

interface Props {
  count: number;
  isAdmin: boolean;
  onMenuPress: () => void;
}

export function ScheduleHeader({ count, isAdmin, onMenuPress }: Props) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation(["components"]);
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
      adminBadge: {
        marginBottom: space[2],
        backgroundColor: muted,
        borderRadius: 5,
        paddingHorizontal: 7,
        paddingVertical: 4,
      },
      adminBadgeText: {
        ...type.eyebrow,
        fontSize: 10,
        letterSpacing: 1.2,
        color: background,
      },
    });
  }, [colors, isDark]);

  return (
    <View style={[styles.hero, { paddingTop: insets.top + space[2] }]}>
      <MenuButton onPress={onMenuPress} />

      <View style={styles.titleRow}>
        <View style={styles.titleText}>
          <Text style={styles.eyebrow} numberOfLines={1}>
            {t("schedule.itemCount", { count })}
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {t("schedule.title")}
          </Text>
        </View>
        {isAdmin && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>{t("schedule.adminBadge")}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
