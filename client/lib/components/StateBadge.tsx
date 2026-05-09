import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import type { Result } from "../models/result";
import { type } from "../theme/typography";

type Props = {
  result: Result | undefined;
  t: (key: string) => string;
};

export function StateBadge({ result, t }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeBadgeStyles(colors), [colors]);

  if (!result) {
    return (
      <View style={[styles.badge, styles.badgeNone]}>
        <Text style={[styles.badgeText, { color: colors.textMuted }]}>
          {t("statNone")}
        </Text>
      </View>
    );
  }
  if (result.submitted) {
    return (
      <View style={[styles.badge, styles.badgeSubmitted]}>
        <Text style={[styles.badgeText, { color: colors.success }]}>
          {t("statSubmitted")}
        </Text>
      </View>
    );
  }
  const sigCount = result.signatureIds?.filter(Boolean).length ?? 0;
  if (sigCount > 0) {
    return (
      <View style={[styles.badge, styles.badgeSigned]}>
        <Text style={[styles.badgeText, { color: "#B45309" }]}>
          {t("statSigned").replace("{n}", String(sigCount))}
        </Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, styles.badgeSaved]}>
      <Text style={[styles.badgeText, { color: colors.primary }]}>
        {t("statSaved")}
      </Text>
    </View>
  );
}

function makeBadgeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    badge: {
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderWidth: 1,
    },
    badgeText: {
      ...type.caption,
      fontWeight: "600",
    },
    badgeNone: {
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    badgeSaved: {
      borderColor: colors.primary + "66",
      backgroundColor: colors.primary + "18",
    },
    badgeSigned: {
      borderColor: "#F59E0B66",
      backgroundColor: "#F59E0B18",
    },
    badgeSubmitted: {
      borderColor: colors.success + "66",
      backgroundColor: colors.success + "18",
    },
  });
}
