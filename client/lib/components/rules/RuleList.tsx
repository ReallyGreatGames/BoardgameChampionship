import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { Rule, RuleType } from "@/lib/models/rule";
import { useRuleStore } from "@/lib/stores/appwrite/rule-store";
import { inset } from "@/lib/theme/spacing";
import { fonts, type } from "@/lib/theme/typography";
import { useDialog } from "@/lib/components/ui/Dialog";
import { Markdown } from "@/lib/components/ui/Markdown";
import { RuleFormData, RuleModal, typeColor } from "@/lib/components/rules/RuleModal";
import { SearchInput } from "@/lib/components/ui/SearchInput";

const RULE_TYPES: RuleType[] = ["change", "addition", "clarification"];

type TypeConfig = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  labelKey: string;
};

const TYPE_CONFIGS: Record<RuleType, TypeConfig> = {
  change: { icon: "swap-horizontal-outline", labelKey: "types.change" },
  addition: { icon: "add-circle-outline", labelKey: "types.addition" },
  clarification: {
    icon: "information-circle-outline",
    labelKey: "types.clarification",
  },
};

type Props = {
  gameId: string;
  isAdmin: boolean;
};

export function RuleList({ gameId, isAdmin }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["rules"]);
  const { collection, add, update, delete: deleteRule } = useRuleStore();
  const { confirm } = useDialog();

  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | undefined>(undefined);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return collection.filter(
      (r) =>
        r.gameId === gameId &&
        (!q ||
          r.title.toLowerCase().includes(q) ||
          r.text.toLowerCase().includes(q)),
    );
  }, [collection, gameId, search]);

  const grouped = useMemo(
    () =>
      RULE_TYPES.reduce<Record<RuleType, Rule[]>>(
        (acc, t) => ({ ...acc, [t]: filtered.filter((r) => r.type === t) }),
        { change: [], addition: [], clarification: [] },
      ),
    [filtered],
  );

  const isEmpty = filtered.length === 0;
  const hasAny = collection.some((r) => r.gameId === gameId);

  async function handleSave(data: RuleFormData) {
    if (editingRule) {
      const ok = await update({ ...editingRule, ...data });
      if (!ok) {
        throw new Error();
      }
    } else {
      const result = await add(data);
      if (!result) {
        throw new Error();
      }
    }
  }

  async function handleDelete(rule: Rule) {
    const ok = await confirm({
      title: t("confirmDelete.title"),
      message: t("confirmDelete.message"),
      confirmLabel: t("confirmDelete.confirm"),
      cancelLabel: t("confirmDelete.cancel"),
      destructive: true,
    });
    if (!ok) {
      return;
    }
    setLoadingId(rule.$id);
    try {
      await deleteRule(rule);
    } finally {
      setLoadingId(null);
    }
  }

  function handleEdit(rule: Rule) {
    setEditingRule({ ...rule });
    setModalVisible(true);
  }

  function handleAdd() {
    setEditingRule(undefined);
    setModalVisible(true);
  }

  return (
    <View style={styles.container}>
      <RuleModal
        visible={modalVisible}
        item={editingRule}
        gameId={gameId}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />

      <View style={styles.searchWrapper}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder={t("search")}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isEmpty ? (
          <View style={styles.empty}>
            <Ionicons
              name={search.trim() ? "search-outline" : "document-text-outline"}
              size={28}
              color={colors.textMuted}
            />
            <Text style={styles.emptyText}>
              {search.trim()
                ? t("noResults")
                : hasAny
                  ? t("noResults")
                  : t("empty")}
            </Text>
          </View>
        ) : (
          RULE_TYPES.map((ruleType) => {
            const rules = grouped[ruleType];
            if (rules.length === 0) {
              return null;
            }
            const cfg = TYPE_CONFIGS[ruleType];
            const color = typeColor(ruleType, colors);

            return (
              <View key={ruleType} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeading}>
                    <Ionicons name={cfg.icon} size={16} color={color} />
                    <Text style={[styles.sectionTitle, { color }]}>
                      {t(cfg.labelKey)}
                    </Text>
                  </View>
                  <Text style={styles.sectionCount}>{rules.length}</Text>
                </View>

                {rules.map((rule, index) => {
                  const isLoading = loadingId === rule.$id;
                  return (
                    <View key={rule.$id} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <View
                          style={[
                            styles.ruleNumber,
                            { backgroundColor: `${color}18` },
                          ]}
                        >
                          <Text style={[styles.ruleNumberText, { color }]}>
                            {String(index + 1).padStart(2, "0")}
                          </Text>
                        </View>
                        <Text style={styles.ruleTitle}>{rule.title}</Text>

                        {isAdmin && (
                          <View style={styles.adminActions}>
                            {isLoading ? (
                              <ActivityIndicator
                                size="small"
                                color={colors.textMuted}
                              />
                            ) : (
                              <>
                                <Pressable
                                  accessibilityRole="button"
                                  accessibilityLabel={t("form.editTitle")}
                                  hitSlop={4}
                                  style={({ pressed }) => [
                                    styles.adminBtn,
                                    pressed && styles.adminBtnPressed,
                                  ]}
                                  onPress={() => handleEdit(rule)}
                                >
                                  <Ionicons
                                    name="create-outline"
                                    size={18}
                                    color={colors.textSecondary}
                                  />
                                </Pressable>
                                <Pressable
                                  accessibilityRole="button"
                                  accessibilityLabel={t("confirmDelete.title")}
                                  hitSlop={4}
                                  style={({ pressed }) => [
                                    styles.adminBtn,
                                    pressed && styles.adminBtnPressed,
                                  ]}
                                  onPress={() => handleDelete(rule)}
                                >
                                  <Ionicons
                                    name="trash-outline"
                                    size={18}
                                    color={colors.error}
                                  />
                                </Pressable>
                              </>
                            )}
                          </View>
                        )}
                      </View>

                      <Markdown textStyle={styles.ruleText}>{rule.text}</Markdown>
                    </View>
                  );
                })}
              </View>
            );
          })
        )}
      </ScrollView>

      {isAdmin && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("form.addTitle")}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={handleAdd}
        >
          <Ionicons name="add" size={28} color={colors.onAccent} />
        </Pressable>
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    searchWrapper: {
      marginBottom: inset.list,
    },
    list: {
      paddingBottom: 88,
      gap: inset.group,
    },
    empty: {
      ...type.body,
      alignItems: "center",
      gap: inset.tight,
      marginTop: inset.section,
    },
    emptyText: {
      ...type.body,
      color: colors.textMuted,
      textAlign: "center",
    },
    section: {
      gap: inset.list,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: inset.list,
      paddingHorizontal: 2,
    },
    sectionHeading: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    sectionTitle: {
      ...type.bodySmall,
      fontFamily: fonts.bodyBold,
    },
    sectionCount: {
      ...type.caption,
      color: colors.textMuted,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: inset.card,
      gap: inset.list,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: inset.list,
    },
    ruleNumber: {
      width: 34,
      height: 34,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    ruleNumberText: {
      ...type.caption,
      fontFamily: fonts.bodyBold,
      letterSpacing: 0.5,
    },
    ruleTitle: {
      ...type.body,
      fontFamily: fonts.bodyBold,
      color: colors.text,
      flex: 1,
      minWidth: 0,
    },
    ruleText: {
      ...type.body,
      color: colors.textSecondary,
    },
    adminActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    adminBtn: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
    },
    adminBtnPressed: {
      backgroundColor: colors.surfaceHigh,
    },
    fab: {
      position: "absolute",
      bottom: inset.group,
      right: inset.group,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.accent,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 8,
    },
    fabPressed: {
      opacity: 0.8,
      transform: [{ scale: 0.96 }],
    },
  });
}
