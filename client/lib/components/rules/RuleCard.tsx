import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { TYPE_CONFIGS, typeColor } from "@/lib/components/rules/types";
import { Markdown } from "@/lib/components/ui/Markdown";
import { Rule } from "@/lib/models/rule";
import { inset } from "@/lib/theme/spacing";
import { fonts, type } from "@/lib/theme/typography";

type Props = {
  rule: Rule;
  isAdmin: boolean;
  isLoading: boolean;
  onEdit: (rule: Rule) => void;
  onDelete: (rule: Rule) => void;
};

export function RuleCard({ rule, isAdmin, isLoading, onEdit, onDelete }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["rules"]);

  const cfg = TYPE_CONFIGS[rule.type];
  const color = typeColor(rule.type, colors);

  return (
    <View style={styles.card}>
      <View style={styles.body}>
        <View style={[styles.badge, { backgroundColor: `${color}18` }]}>
          <Ionicons name={cfg.icon} size={16} color={color} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.typeLabel, { color }]}>{t(cfg.shortKey)}</Text>
          <Text style={styles.title}>{rule.title}</Text>
          <Markdown textStyle={styles.text}>{rule.text}</Markdown>
        </View>
      </View>

      {isAdmin && (
        <View style={styles.actions}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.textMuted} />
          ) : (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("form.editTitle")}
                style={({ pressed }) => [
                  styles.action,
                  pressed && styles.actionPressed,
                ]}
                onPress={() => onEdit(rule)}
              >
                <Ionicons
                  name="create-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.actionLabel}>{t("actions.edit")}</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("confirmDelete.title")}
                style={({ pressed }) => [
                  styles.action,
                  styles.deleteAction,
                  pressed && styles.deleteActionPressed,
                ]}
                onPress={() => onDelete(rule)}
              >
                <Ionicons name="trash-outline" size={16} color={colors.error} />
                <Text style={[styles.actionLabel, { color: colors.error }]}>
                  {t("actions.delete")}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
    },
    body: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: inset.list,
      padding: inset.card,
    },
    badge: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    typeLabel: {
      ...type.eyebrow,
      fontSize: 10,
      lineHeight: 13,
      letterSpacing: 1.2,
    },
    title: {
      ...type.body,
      fontFamily: fonts.bodyBold,
      color: colors.text,
    },
    text: {
      ...type.body,
      color: colors.textSecondary,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: inset.tight,
      paddingLeft: inset.card + 28 + inset.list,
      paddingRight: inset.card,
      paddingBottom: inset.card,
      minHeight: 44,
    },
    action: {
      flex: 1,
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    actionPressed: {
      backgroundColor: colors.surfaceHigh,
    },
    actionLabel: {
      ...type.bodySmall,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
    },
    deleteAction: {
      borderColor: `${colors.error}40`,
      backgroundColor: `${colors.error}12`,
    },
    deleteActionPressed: {
      backgroundColor: `${colors.error}24`,
    },
  });
}
