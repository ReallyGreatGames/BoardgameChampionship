import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import { Rule, RuleType } from "../models/rule";
import { useRuleStore } from "../stores/appwrite/rule-store";
import { inset } from "../theme/spacing";
import { type } from "../theme/typography";
import { useDialog } from "./Dialog";
import { RuleFormData, RuleModal, typeColor } from "./RuleModal";

const RULE_TYPES: RuleType[] = ["change", "addition", "clarification"];

type TypeConfig = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  labelKey: string;
};

const TYPE_CONFIGS: Record<RuleType, TypeConfig> = {
  change: { icon: "swap-horizontal-outline", labelKey: "types.change" },
  addition: { icon: "add-circle-outline", labelKey: "types.addition" },
  clarification: { icon: "information-circle-outline", labelKey: "types.clarification" },
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
        (!q || r.title.toLowerCase().includes(q) || r.text.toLowerCase().includes(q)),
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
      if (!ok) throw new Error();
    } else {
      const result = await add(data);
      if (!result) throw new Error();
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
    if (!ok) return;
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
    <>
      <RuleModal
        visible={modalVisible}
        item={editingRule}
        gameId={gameId}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={t("search")}
          placeholderTextColor={colors.textPlaceholder}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isEmpty ? (
          <Text style={styles.empty}>
            {search.trim() ? t("noResults") : hasAny ? t("noResults") : t("empty")}
          </Text>
        ) : (
          RULE_TYPES.map((ruleType) => {
            const rules = grouped[ruleType];
            if (rules.length === 0) return null;
            const cfg = TYPE_CONFIGS[ruleType];
            const color = typeColor(ruleType, colors);

            return (
              <View key={ruleType} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name={cfg.icon} size={14} color={color} />
                  <Text style={[styles.sectionTitle, { color }]}>{t(cfg.labelKey)}</Text>
                </View>

                {rules.map((rule) => {
                  const isLoading = loadingId === rule.$id;
                  return (
                    <View
                      key={rule.$id}
                      style={[styles.card, { borderLeftColor: color }]}
                    >
                      <View style={styles.cardContent}>
                        <Text style={styles.ruleTitle}>{rule.title}</Text>
                        <Text style={styles.ruleText}>{rule.text}</Text>
                      </View>

                      {isAdmin && (
                        <View style={styles.adminBar}>
                          <View style={styles.adminBarSpacer} />
                          {isLoading
                            ? <ActivityIndicator size="small" color={colors.textMuted} />
                            : (
                              <>
                                <TouchableOpacity
                                  style={styles.adminBtn}
                                  onPress={() => handleEdit(rule)}
                                >
                                  <Ionicons name="create-outline" size={16} color={colors.text} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.adminBtn}
                                  onPress={() => handleDelete(rule)}
                                >
                                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                                </TouchableOpacity>
                              </>
                            )
                          }
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })
        )}
      </ScrollView>

      {isAdmin && (
        <TouchableOpacity style={styles.fab} onPress={handleAdd} activeOpacity={0.85}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: inset.card,
      paddingVertical: 10,
      gap: 8,
      marginBottom: inset.list,
    },
    searchInput: {
      ...type.body,
      color: colors.text,
      flex: 1,
      padding: 0,
    },
    list: {
      paddingBottom: 88,
      gap: inset.group,
    },
    empty: {
      ...type.body,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: inset.section,
    },
    section: {
      gap: inset.list,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    sectionTitle: {
      ...type.eyebrow,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 3,
      borderRadius: 10,
      overflow: "hidden",
    },
    cardContent: {
      padding: inset.card,
      paddingBottom: 10,
      gap: 4,
    },
    ruleTitle: {
      ...type.bodySmall,
      color: colors.text,
      fontWeight: "700",
    },
    ruleText: {
      ...type.body,
      color: colors.textSecondary,
    },
    adminBar: {
      flexDirection: "row",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      paddingHorizontal: inset.card,
      paddingVertical: 6,
      gap: 4,
    },
    adminBarSpacer: { flex: 1 },
    adminBtn: {
      padding: 6,
      borderRadius: 6,
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
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 8,
    },
  });
}
