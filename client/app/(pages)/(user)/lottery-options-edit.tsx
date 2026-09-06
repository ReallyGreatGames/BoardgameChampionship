import { ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { BackButton } from "@/lib/components/ui/BackButton";
import { useDialog } from "@/lib/components/ui/Dialog";
import {
  LotteryConfigInput,
  useOptionsLotteryActions,
} from "@/lib/hooks/useOptionsLotteryActions";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { LotteryOption, OptionsLottery } from "@/lib/models/options-lottery";
import { useOptionsLotteryStore } from "@/lib/stores/appwrite/options-lottery-store";
import { useTableStore } from "@/lib/stores/appwrite/table-store";
import { inset } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { ui } from "@/lib/theme/ui";
import { validateLotteryConfig } from "@/lib/utils/lottery-draw";
import { parseOptionsLottery } from "@/lib/utils/options-lottery";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

function emptyOption(): LotteryOption {
  return { id: ID.unique(), title: "", description: "", weight: 1, maxPerTable: 1 };
}

export default function LotteryOptionsEditScreen() {
  useRequireAuth();
  const { gameId, instanceId, draft, from } = useLocalSearchParams<{
    gameId: string;
    instanceId?: string;
    draft?: string;
    from?: string;
  }>();
  const { isAdmin } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const rows = useOptionsLotteryStore((s) => s.collection);
  const tables = useTableStore((s) => s.collection);

  const instance = useMemo(() => {
    const row = rows.find((r) => r.$id === instanceId);
    return row ? parseOptionsLottery(row) : null;
  }, [rows, instanceId]);

  const tableNumbers = useMemo(
    () =>
      tables
        .filter((tbl) => (typeof tbl.game === "string" ? tbl.game : tbl.game.$id) === gameId)
        .map((tbl) => tbl.tableNumber),
    [tables, gameId],
  );

  const backToLottery = () =>
    router.replace((from as any) ?? `/(pages)/(user)/lottery?gameId=${gameId}`);

  if (!isAdmin) {
    backToLottery();
    return null;
  }

  return (
    <LotteryOptionsEditForm
      // Remounts (resetting all local form state) whenever this is a
      // logically different visit: a different existing instance, or a
      // fresh "new lottery" draft (draft is a fresh id minted by
      // lottery-add.tsx every time the Options tile is tapped, so two
      // separate create attempts never share state even though both lack
      // an instanceId). The draft id is preserved across the
      // create-then-redirect-to-edit-mode transition, so that transition
      // does NOT force a remount / lose what was just saved.
      key={draft ?? instanceId ?? "new"}
      gameId={gameId}
      draft={draft}
      from={from}
      instance={instance}
      tableNumbers={tableNumbers}
      colors={colors}
      styles={styles}
      backToLottery={backToLottery}
    />
  );
}

function LotteryOptionsEditForm({
  gameId,
  draft,
  from,
  instance,
  tableNumbers,
  colors,
  styles,
  backToLottery,
}: {
  gameId: string;
  draft?: string;
  from?: string;
  instance: OptionsLottery | null;
  tableNumbers: number[];
  colors: ReturnType<typeof useTheme>["colors"];
  styles: ReturnType<typeof makeStyles>;
  backToLottery: () => void;
}) {
  const { t } = useTranslation(["lotteryOptions"]);
  const { confirm } = useDialog();
  const actions = useOptionsLotteryActions();

  const [name, setName] = useState(instance?.name ?? "");
  const [pullsPerTable, setPullsPerTable] = useState(String(instance?.pullsPerTable ?? 1));
  const [sameForAllTables, setSameForAllTables] = useState(instance?.sameForAllTables ?? false);
  const [options, setOptions] = useState<LotteryOption[]>(instance?.options ?? [emptyOption()]);

  const pullsPerTableNumber = parseInt(pullsPerTable, 10) || 0;
  const validationError = useMemo(
    () => validateLotteryConfig(options, pullsPerTableNumber),
    [options, pullsPerTableNumber],
  );

  function updateOption(id: string, patch: Partial<LotteryOption>) {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }

  function addOption() {
    setOptions((prev) => [...prev, emptyOption()]);
  }

  async function removeOption(id: string) {
    if (instance && !actions.canRemoveOption(instance, id)) {
      await confirm({
        title: t("removeOption"),
        message: t("removeOptionBlocked"),
        cancelLabel: null,
      });
      return;
    }
    setOptions((prev) => prev.filter((o) => o.id !== id));
  }

  async function handleSave() {
    if (validationError) {
      return;
    }
    const config: LotteryConfigInput = {
      name,
      pullsPerTable: pullsPerTableNumber,
      sameForAllTables,
      options,
    };
    if (instance) {
      await actions.update(instance, config);
    } else {
      const created = await actions.create(gameId, config);
      if (created) {
        router.replace(
          (`/(pages)/(user)/lottery-options-edit?gameId=${gameId}&draft=${draft}&instanceId=${created.$id}` +
            (from ? `&from=${encodeURIComponent(from)}` : "")) as any,
        );
      }
    }
  }

  async function handlePull() {
    if (!instance) {
      return;
    }
    await actions.pull(
      instance,
      tableNumbers,
      instance.results.length > 0
        ? {
            title: t("rePullConfirm.title"),
            message: t("rePullConfirm.message"),
            confirmLabel: t("rePullConfirm.confirm"),
            cancelLabel: t("rePullConfirm.cancel"),
            destructive: true,
          }
        : undefined,
    );
  }

  async function handleClearResults() {
    if (!instance) {
      return;
    }
    await actions.clearResults(instance, {
      title: t("clearResultsConfirm.title"),
      message: t("clearResultsConfirm.message"),
      confirmLabel: t("clearResultsConfirm.confirm"),
      cancelLabel: t("clearResultsConfirm.cancel"),
      destructive: true,
    });
  }

  async function handleDelete() {
    if (!instance) {
      return;
    }
    const ok = await actions.remove(instance, {
      title: t("deleteConfirm.title"),
      message: t("deleteConfirm.message"),
      confirmLabel: t("deleteConfirm.confirm"),
      cancelLabel: t("deleteConfirm.cancel"),
      destructive: true,
    });
    if (ok) {
      backToLottery();
    }
  }

  return (
    <View style={styles.container}>
      <BackButton onPress={backToLottery} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{instance ? t("editTitleExisting") : t("editTitleNew")}</Text>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t("nameLabel")}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t("namePlaceholder")}
            placeholderTextColor={colors.textPlaceholder}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t("pullsPerTableLabel")}</Text>
          <TextInput
            style={styles.input}
            value={pullsPerTable}
            onChangeText={setPullsPerTable}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLabels}>
            <Text style={styles.fieldLabel}>{t("sameForAllTablesLabel")}</Text>
            <Text style={styles.switchDescription}>{t("sameForAllTablesDescription")}</Text>
          </View>
          <Switch
            value={sameForAllTables}
            onValueChange={setSameForAllTables}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={colors.text}
          />
        </View>

        <Text style={styles.sectionTitle}>{t("optionsSectionTitle")}</Text>
        {options.map((option) => (
          <View key={option.id} style={styles.optionCard}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t("optionTitleLabel")}</Text>
              <TextInput
                style={styles.input}
                value={option.title}
                onChangeText={(v) => updateOption(option.id, { title: v })}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t("optionDescriptionLabel")}</Text>
              <TextInput
                style={styles.input}
                value={option.description ?? ""}
                onChangeText={(v) => updateOption(option.id, { description: v })}
              />
            </View>
            <View style={styles.optionRow}>
              <View style={[styles.field, styles.optionField]}>
                <Text style={styles.fieldLabel}>{t("optionWeightLabel")}</Text>
                <TextInput
                  style={styles.input}
                  value={String(option.weight)}
                  onChangeText={(v) => updateOption(option.id, { weight: parseInt(v, 10) || 0 })}
                  keyboardType="number-pad"
                />
              </View>
              <View style={[styles.field, styles.optionField]}>
                <Text style={styles.fieldLabel}>{t("optionMaxPerTableLabel")}</Text>
                <TextInput
                  style={styles.input}
                  value={String(option.maxPerTable)}
                  onChangeText={(v) =>
                    updateOption(option.id, { maxPerTable: parseInt(v, 10) || 0 })
                  }
                  keyboardType="number-pad"
                />
              </View>
              <Pressable
                style={styles.removeBtn}
                onPress={() => removeOption(option.id)}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </Pressable>
            </View>
          </View>
        ))}
        <Pressable style={styles.addOptionBtn} onPress={addOption}>
          <Ionicons name="add" size={18} color={colors.primary} />
          <Text style={styles.addOptionText}>{t("addOption")}</Text>
        </Pressable>

        {validationError && (
          <Text style={styles.errorText}>
            {String(t(`errors.${validationError.code}`, validationError.meta as any))}
          </Text>
        )}

        <Pressable
          style={[styles.saveBtn, !!validationError && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!!validationError || actions.saving}
        >
          {actions.saving ? (
            <ActivityIndicator size="small" color={colors.onAccent} />
          ) : (
            <Text style={styles.saveBtnText}>{t("save")}</Text>
          )}
        </Pressable>

        {instance && (
          <>
            <Pressable
              style={[
                styles.pullBtn,
                (!!validationError || tableNumbers.length === 0) && styles.saveBtnDisabled,
              ]}
              onPress={handlePull}
              disabled={
                !!validationError || actions.isPulling(instance.$id) || tableNumbers.length === 0
              }
            >
              {actions.isPulling(instance.$id) ? (
                <ActivityIndicator size="small" color={colors.onAccent} />
              ) : (
                <Text style={styles.saveBtnText}>{t("pull")}</Text>
              )}
            </Pressable>

            <View style={styles.dangerRow}>
              <Pressable
                style={[
                  styles.clearResultsBtn,
                  styles.dangerRowBtn,
                  instance.results.length === 0 && styles.saveBtnDisabled,
                ]}
                onPress={handleClearResults}
                disabled={instance.results.length === 0 || actions.isClearing(instance.$id)}
              >
                {actions.isClearing(instance.$id) ? (
                  <ActivityIndicator size="small" color={colors.error} />
                ) : (
                  <Text style={styles.deleteBtnText}>{t("clearResults")}</Text>
                )}
              </Pressable>

              <Pressable
                style={[styles.deleteBtn, styles.dangerRowBtn]}
                onPress={handleDelete}
                disabled={actions.isDeleting(instance.$id)}
              >
                {actions.isDeleting(instance.$id) ? (
                  <ActivityIndicator size="small" color={colors.error} />
                ) : (
                  <Text style={styles.deleteBtnText}>{t("deleteConfirm.confirm")}</Text>
                )}
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>{t("resultsSectionTitle")}</Text>
            {instance.results.length === 0 ? (
              <Text style={styles.emptyResults}>{t("notPulledYet")}</Text>
            ) : (
              <Pressable
                style={styles.viewResultsBtn}
                onPress={() =>
                  router.push(`/(pages)/(user)/lottery-results?gameId=${gameId}`)
                }
              >
                <Ionicons name="expand-outline" size={18} color={colors.primary} />
                <Text style={styles.viewResultsBtnText}>{t("viewResultsFullscreen")}</Text>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: inset.screen,
      paddingTop: inset.group,
    },
    scrollContent: {
      gap: inset.list,
      paddingBottom: inset.screenBottom,
    },
    title: {
      ...type.h1,
      color: colors.text,
      marginTop: inset.tight,
      marginBottom: inset.tight,
    },
    sectionTitle: {
      ...type.h3,
      color: colors.text,
      marginTop: inset.tight,
    },
    field: {
      gap: 6,
    },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: inset.tight,
    },
    switchLabels: {
      flex: 1,
      gap: 2,
    },
    switchDescription: {
      ...type.bodySmall,
      color: colors.textSecondary,
    },
    fieldLabel: {
      ...type.caption,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    input: {
      ...type.body,
      color: colors.text,
      backgroundColor: colors.surfaceHigh,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: ui.inputRadius,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    optionCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: ui.cardRadius,
      padding: inset.card,
      gap: inset.list,
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: inset.tight,
    },
    optionField: {
      flex: 1,
    },
    removeBtn: {
      padding: 8,
    },
    addOptionBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: ui.buttonRadius,
      paddingVertical: 10,
    },
    addOptionText: {
      ...type.button,
      color: colors.primary,
    },
    errorText: {
      ...type.bodySmall,
      color: colors.error,
    },
    saveBtn: {
      backgroundColor: colors.accent,
      borderRadius: ui.buttonRadius,
      paddingVertical: 12,
      alignItems: "center",
    },
    pullBtn: {
      backgroundColor: colors.primary,
      borderRadius: ui.buttonRadius,
      paddingVertical: 12,
      alignItems: "center",
    },
    saveBtnDisabled: {
      opacity: ui.disabledOpacity,
    },
    saveBtnText: {
      ...type.button,
      color: colors.onAccent,
    },
    emptyResults: {
      ...type.bodySmall,
      color: colors.textMuted,
    },
    viewResultsBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: ui.buttonRadius,
      paddingVertical: 10,
    },
    viewResultsBtnText: {
      ...type.button,
      color: colors.primary,
    },
    dangerRow: {
      flexDirection: "row",
      gap: inset.tight,
    },
    dangerRowBtn: {
      flex: 1,
    },
    clearResultsBtn: {
      borderWidth: 1,
      borderColor: colors.error,
      borderStyle: "dashed",
      borderRadius: ui.buttonRadius,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    deleteBtn: {
      borderWidth: 1,
      borderColor: colors.error,
      borderRadius: ui.buttonRadius,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    deleteBtnText: {
      ...type.button,
      color: colors.error,
    },
  });
}
