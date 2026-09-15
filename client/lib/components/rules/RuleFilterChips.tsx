import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import {
  RULE_TYPES,
  RuleFilter,
  TYPE_CONFIGS,
  typeColor,
} from "@/lib/components/rules/types";
import { inset } from "@/lib/theme/spacing";
import { fonts, type } from "@/lib/theme/typography";

type Props = {
  counts: Record<RuleFilter, number>;
  value: RuleFilter;
  onChange: (filter: RuleFilter) => void;
};

export function RuleFilterChips({ counts, value, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["rules"]);

  const chips: { key: RuleFilter; label: string; color: string }[] = [
    { key: "all", label: t("filters.all"), color: colors.primary },
    ...RULE_TYPES.map((ruleType) => ({
      key: ruleType as RuleFilter,
      label: t(TYPE_CONFIGS[ruleType].filterKey),
      color: typeColor(ruleType, colors),
    })),
  ];

  return (
    <View style={styles.row}>
      {chips.map((chip) => {
        const active = value === chip.key;
        const ink = active ? colors.onAccent : colors.textSecondary;
        return (
          <Pressable
            key={chip.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${chip.label} (${counts[chip.key]})`}
            style={[
              styles.chip,
              active && { backgroundColor: chip.color, borderColor: chip.color },
            ]}
            onPress={() => onChange(active ? "all" : chip.key)}
          >
            <Text style={[styles.count, { color: ink }]}>{counts[chip.key]}</Text>
            <Text style={[styles.label, { color: ink }]} numberOfLines={1}>
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      gap: inset.tight,
    },
    chip: {
      flex: 1,
      minWidth: 0,
      minHeight: 44,
      paddingVertical: 6,
      paddingHorizontal: 4,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      gap: 1,
    },
    count: {
      fontFamily: fonts.displayBold,
      fontSize: 20,
      lineHeight: 22,
    },
    label: {
      ...type.caption,
      fontSize: 11,
      lineHeight: 14,
    },
  });
}
