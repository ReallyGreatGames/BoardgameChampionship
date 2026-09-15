import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { RuleCard } from "@/lib/components/rules/RuleCard";
import { RuleFilterChips } from "@/lib/components/rules/RuleFilterChips";
import { RuleFormData, RuleModal } from "@/lib/components/rules/RuleModal";
import { RULE_TYPES, RuleFilter } from "@/lib/components/rules/types";
import { useDialog } from "@/lib/components/ui/Dialog";
import { SearchInput } from "@/lib/components/ui/SearchInput";
import { Rule } from "@/lib/models/rule";
import { useRuleStore } from "@/lib/stores/appwrite/rule-store";
import { inset } from "@/lib/theme/spacing";
import { fonts, type } from "@/lib/theme/typography";

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
  const [filter, setFilter] = useState<RuleFilter>("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | undefined>(undefined);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const bySearch = useMemo(() => {
    const q = search.trim().toLowerCase();
    return collection.filter(
      (r) =>
        r.gameId === gameId &&
        (!q ||
          r.title.toLowerCase().includes(q) ||
          r.text.toLowerCase().includes(q)),
    );
  }, [collection, gameId, search]);

  const counts = useMemo(
    () =>
      RULE_TYPES.reduce<Record<RuleFilter, number>>(
        (acc, ruleType) => ({
          ...acc,
          [ruleType]: bySearch.filter((r) => r.type === ruleType).length,
        }),
        { all: bySearch.length } as Record<RuleFilter, number>,
      ),
    [bySearch],
  );

  const filtered = useMemo(
    () =>
      filter === "all" ? bySearch : bySearch.filter((r) => r.type === filter),
    [bySearch, filter],
  );

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

      <View style={styles.filterBar}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder={t("search")}
        />
        <RuleFilterChips counts={counts} value={filter} onChange={setFilter} />
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>
            {hasAny ? t("noResults") : t("empty")}
          </Text>
        ) : (
          filtered.map((rule) => (
            <RuleCard
              key={rule.$id}
              rule={rule}
              isAdmin={isAdmin}
              isLoading={loadingId === rule.$id}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </ScrollView>

      {isAdmin && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("form.addTitle")}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={handleAdd}
        >
          <Ionicons name="add" size={22} color={colors.onAccent} />
          <Text style={styles.fabLabel}>{t("form.addShort")}</Text>
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
    filterBar: {
      gap: inset.list,
      paddingBottom: inset.list,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    list: {
      paddingTop: inset.list,
      paddingBottom: 96,
      gap: inset.list,
    },
    emptyText: {
      ...type.bodySmall,
      color: colors.textMuted,
      textAlign: "center",
      paddingVertical: inset.section,
    },
    fab: {
      position: "absolute",
      bottom: inset.group,
      right: 0,
      height: 56,
      paddingHorizontal: 22,
      borderRadius: 28,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.accent,
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
    fabLabel: {
      ...type.body,
      fontFamily: fonts.bodyBold,
      fontSize: 15,
      lineHeight: 20,
      color: colors.onAccent,
    },
  });
}
