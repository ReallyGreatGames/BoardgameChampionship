import { useEffect, useMemo, useRef, useState } from "react";
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
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { useDialog } from "@/lib/components/ui/Dialog";
import { ChipGroup, ChipOption } from "@/lib/components/ui/ChipGroup";
import { ResizableTextInput } from "@/lib/components/ui/ResizableTextInput";
import { SelectPicker, SelectOption } from "@/lib/components/ui/SelectPicker";
import { useImportActivity } from "@/lib/components/admin/ImportActivityContext";
import { ImportProgressBar } from "./ImportProgressBar";
import {
  deleteAllRules,
  fetchExistingRulesForGame,
  importRules,
  ImportRowStatus,
  matchExisting,
  RuleImportRow,
} from "@/lib/import/rule-import-service";
import { parseRulesText } from "@/lib/import/rule-parser";
import { Rule, RuleType } from "@/lib/models/rule";
import { useRuleStore } from "@/lib/stores/appwrite/rule-store";
import { useScheduleStore } from "@/lib/stores/appwrite/schedule-store";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";

type Phase = "paste" | "preview" | "deleting" | "importing" | "done";

export function ImportRules() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["importTab", "rules"]);
  const { confirm } = useDialog();
  const { setBusy } = useImportActivity();

  const TYPE_OPTIONS: ChipOption<RuleType>[] = useMemo(
    () => [
      {
        value: "clarification",
        label: t("types.clarification", { ns: "rules" }),
        icon: "information-circle-outline",
      },
      {
        value: "change",
        label: t("types.change", { ns: "rules" }),
        icon: "swap-horizontal-outline",
      },
      {
        value: "addition",
        label: t("types.addition", { ns: "rules" }),
        icon: "add-circle-outline",
      },
    ],
    [t],
  );

  const ACTION_LABELS: Record<RuleImportRow["action"], string> = {
    create: t("rules.actionNew"),
    update: t("rules.actionUpdate"),
    unchanged: t("rules.actionUnchanged"),
  };

  const { collection: schedules } = useScheduleStore();
  const { collection: existingRules } = useRuleStore();

  const gameOptions: SelectOption<string>[] = useMemo(
    () =>
      [...schedules]
        .filter((s) => !!s.gameId)
        .sort((a, b) => a.sortIndex - b.sortIndex)
        .map((s) => ({ value: s.gameId!, label: s.title })),
    [schedules],
  );

  const [gameId, setGameId] = useState<string>("");
  const [pasteText, setPasteText] = useState("");
  const [wipeExisting, setWipeExisting] = useState(false);
  const [phase, setPhase] = useState<Phase>("paste");
  const [rows, setRows] = useState<RuleImportRow[]>([]);
  const [statuses, setStatuses] = useState<ImportRowStatus[]>([]);
  const [rulesToDelete, setRulesToDelete] = useState<Rule[]>([]);
  const [deleteStatuses, setDeleteStatuses] = useState<ImportRowStatus[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

  const mountedRef = useRef(true);
  const cancelRequestedRef = useRef(false);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  useEffect(() => {
    setBusy(phase === "deleting" || phase === "importing");
    return () => setBusy(false);
  }, [phase, setBusy]);

  useEffect(() => {
    if (!gameId && gameOptions.length > 0) {
      setGameId(gameOptions[0].value);
    }
  }, [gameId, gameOptions]);

  const selectedGameTitle =
    gameOptions.find((o) => o.value === gameId)?.label ?? "";

  const existingCountForGame = useMemo(
    () => existingRules.filter((r) => r.gameId === gameId).length,
    [existingRules, gameId],
  );

  async function handleParse() {
    setParseError(null);
    const parsed = parseRulesText(pasteText);
    if (parsed.length === 0) {
      setParseError(t("rules.parseError"));
      return;
    }

    setParsing(true);
    try {
      const fresh = await fetchExistingRulesForGame(gameId);
      if (!mountedRef.current) {
        return;
      }
      const matched = wipeExisting
        ? parsed.map((entry) => ({ ...entry, action: "create" as const }))
        : matchExisting(parsed, fresh, gameId);
      setRows(matched);
      setStatuses(matched.map(() => ({ state: "pending" })));
      setRulesToDelete(fresh);
      setPhase("preview");
    } catch (e: unknown) {
      if (mountedRef.current) {
        setParseError(e instanceof Error ? e.message : t("rules.parseError"));
      }
    } finally {
      if (mountedRef.current) {
        setParsing(false);
      }
    }
  }

  function updateRow(i: number, patch: Partial<RuleImportRow>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function forceIncludeRow(i: number) {
    updateRow(i, { action: "update" });
  }

  function deleteRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  const importableCount = rows.filter((r) => r.action !== "unchanged").length;

  async function runImport() {
    cancelRequestedRef.current = false;
    setPhase("importing");
    await importRules(
      rows,
      gameId,
      (i, status) => {
        if (!mountedRef.current) {
          return;
        }
        setStatuses((prev) => {
          const next = [...prev];
          next[i] = status;
          return next;
        });
      },
      () => mountedRef.current && !cancelRequestedRef.current,
    );
    if (mountedRef.current) {
      setPhase("done");
    }
  }

  async function retryFailed() {
    const failedIndexes = rows
      .map((_, i) => i)
      .filter((i) => statuses[i]?.state === "error");
    if (failedIndexes.length === 0) {
      return;
    }
    cancelRequestedRef.current = false;
    setPhase("importing");
    const retryRows = failedIndexes.map((i) => rows[i]);
    await importRules(
      retryRows,
      gameId,
      (ri, status) => {
        if (!mountedRef.current) {
          return;
        }
        const i = failedIndexes[ri];
        setStatuses((prev) => {
          const next = [...prev];
          next[i] = status;
          return next;
        });
      },
      () => mountedRef.current && !cancelRequestedRef.current,
    );
    if (mountedRef.current) {
      setPhase("done");
    }
  }

  function cancelImporting() {
    cancelRequestedRef.current = true;
    const cancelledMessage = t("shared.cancelled");
    setStatuses((prev) =>
      prev.map((s) =>
        s.state === "pending" ? { state: "error", message: cancelledMessage } : s,
      ),
    );
    setPhase("done");
  }

  function cancelDeleting() {
    cancelRequestedRef.current = true;
    const cancelledMessage = t("shared.cancelled");
    setDeleteStatuses((prev) =>
      prev.map((s) =>
        s.state === "pending" ? { state: "error", message: cancelledMessage } : s,
      ),
    );
    setPhase("done");
  }

  async function handleImportClick() {
    const ok = await confirm(
      wipeExisting
        ? {
            title: t("rules.confirmWipeTitle"),
            message: t("rules.confirmWipeMessage", {
              count: rulesToDelete.length,
              importCount: importableCount,
              game: selectedGameTitle,
            }),
            confirmLabel: t("shared.deleteAndImport"),
            destructive: true,
          }
        : {
            title: t("rules.confirmTitle", { count: importableCount }),
            message: t("rules.confirmMessage", { game: selectedGameTitle }),
            confirmLabel: t("rules.confirmLabel"),
          },
    );
    if (!ok) {
      return;
    }

    if (wipeExisting && rulesToDelete.length > 0) {
      cancelRequestedRef.current = false;
      setPhase("deleting");
      setDeleteStatuses(rulesToDelete.map(() => ({ state: "pending" })));
      await deleteAllRules(
        rulesToDelete,
        (i, status) => {
          if (!mountedRef.current) {
            return;
          }
          setDeleteStatuses((prev) => {
            const next = [...prev];
            next[i] = status;
            return next;
          });
        },
        () => mountedRef.current && !cancelRequestedRef.current,
      );
      if (!mountedRef.current || cancelRequestedRef.current) {
        return;
      }
    }

    await runImport();
  }

  function handleReset() {
    setPhase("paste");
    setPasteText("");
    setWipeExisting(false);
    setRows([]);
    setStatuses([]);
    setRulesToDelete([]);
    setDeleteStatuses([]);
    setParseError(null);
  }

  if (phase === "paste") {
    return (
      <View style={styles.container}>
        <View style={styles.pickerRow}>
          <Text style={styles.pickerLabel}>{t("rules.gameLabel")}</Text>
          {gameOptions.length > 0 ? (
            <SelectPicker
              value={gameId || gameOptions[0].value}
              options={gameOptions}
              onChange={setGameId}
            />
          ) : (
            <Text style={styles.pickSubtitle}>{t("rules.noGames")}</Text>
          )}
        </View>

        <Text style={styles.pickSubtitle}>{t("rules.pasteSubtitle")}</Text>

        <ResizableTextInput
          value={pasteText}
          onChangeText={setPasteText}
          placeholder={t("rules.pastePlaceholder")}
          style={styles.pasteInput}
          resetOn={phase === "paste" && pasteText === ""}
        />

        {parseError && <Text style={styles.pickError}>{parseError}</Text>}

        <View style={styles.wipeToggleRow}>
          <Switch
            value={wipeExisting}
            onValueChange={setWipeExisting}
            disabled={!gameId || existingCountForGame === 0}
          />
          <Text style={styles.wipeToggleLabel}>
            {existingCountForGame === 0
              ? t("rules.wipeToggleLabelEmpty")
              : t("rules.wipeToggleLabel", { count: existingCountForGame })}
          </Text>
        </View>

        <Pressable
          style={[
            styles.pickButton,
            (!pasteText.trim() || !gameId || parsing) && styles.pickButtonDisabled,
          ]}
          onPress={handleParse}
          disabled={!pasteText.trim() || !gameId || parsing}
        >
          {parsing ? (
            <ActivityIndicator size="small" color={colors.onAccent} />
          ) : (
            <Text style={styles.pickButtonText}>{t("rules.parseButton")}</Text>
          )}
        </Pressable>
      </View>
    );
  }

  if (phase === "deleting") {
    const deleteSucceeded = deleteStatuses.filter((s) => s.state === "success").length;
    const deleteFailed = deleteStatuses.filter((s) => s.state === "error").length;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t("rules.deletingTitle", {
              done: deleteSucceeded + deleteFailed,
              total: rulesToDelete.length,
            })}
          </Text>
          <Pressable style={styles.cancelButton} onPress={cancelDeleting}>
            <Text style={styles.cancelButtonText}>{t("shared.cancel")}</Text>
          </Pressable>
        </View>
        <View style={styles.progressWrap}>
          <ImportProgressBar
            label={selectedGameTitle}
            total={rulesToDelete.length}
            succeeded={deleteSucceeded}
            failedItems={rulesToDelete.flatMap((rule, i) => {
              const status = deleteStatuses[i];
              return status?.state === "error"
                ? [{ id: String(i), label: rule.title, message: status.message }]
                : [];
            })}
            active
          />
        </View>
      </View>
    );
  }

  const successCount = statuses.filter((s) => s.state === "success").length;
  const errorCount = statuses.filter((s) => s.state === "error").length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {phase === "preview" &&
            t("rules.previewTitle", {
              count: rows.length,
              game: selectedGameTitle,
            })}
          {phase === "importing" &&
            t("rules.importingTitle", {
              done: successCount + errorCount,
              total: rows.length,
            })}
          {phase === "done" &&
            t("rules.doneTitle", { success: successCount, failed: errorCount })}
        </Text>

        <View style={styles.headerActions}>
          {phase === "preview" && (
            <>
              <Pressable style={styles.secondaryButton} onPress={handleReset}>
                <Text style={styles.secondaryButtonText}>
                  {t("rules.startOver")}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.importButton,
                  importableCount === 0 && styles.importButtonDisabled,
                ]}
                onPress={handleImportClick}
                disabled={importableCount === 0}
              >
                <Text style={styles.importButtonText}>
                  {importableCount === 0
                    ? t("rules.nothingToImport")
                    : t("rules.importButton", { count: importableCount })}
                </Text>
              </Pressable>
            </>
          )}
          {phase === "importing" && (
            <Pressable style={styles.cancelButton} onPress={cancelImporting}>
              <Text style={styles.cancelButtonText}>{t("shared.cancel")}</Text>
            </Pressable>
          )}
          {phase === "done" && (
            <Pressable style={styles.secondaryButton} onPress={handleReset}>
              <Text style={styles.secondaryButtonText}>
                {t("rules.importMore")}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {(phase === "importing" || phase === "done") && (
        <View style={styles.progressWrap}>
          <ImportProgressBar
            label={selectedGameTitle}
            total={rows.length}
            succeeded={successCount}
            failedItems={rows.flatMap((row, i) => {
              const status = statuses[i];
              return status?.state === "error"
                ? [{ id: String(i), label: row.title, message: status.message }]
                : [];
            })}
            active={phase === "importing"}
            onRetry={errorCount > 0 ? retryFailed : undefined}
          />
        </View>
      )}

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {rows.map((row, i) => {
          const status = statuses[i];
          const editable = phase === "preview";
          return (
            <View key={i} style={styles.card}>
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.actionBadge,
                    row.action === "create" && styles.actionBadgeCreate,
                    row.action === "update" && styles.actionBadgeUpdate,
                    row.action === "unchanged" && styles.actionBadgeUnchanged,
                  ]}
                >
                  <Text style={styles.actionBadgeText}>
                    {ACTION_LABELS[row.action]}
                  </Text>
                </View>
                <StatusIcon status={status} styles={styles} primaryColor={colors.primary} />
                <View style={styles.cardHeaderSpacer} />
                {editable && row.action === "unchanged" && (
                  <Pressable
                    onPress={() => forceIncludeRow(i)}
                    style={styles.forceBtn}
                  >
                    <Text style={styles.forceBtnText}>
                      {t("rules.forceInclude")}
                    </Text>
                  </Pressable>
                )}
                {editable && (
                  <Pressable onPress={() => deleteRow(i)} style={styles.deleteBtn}>
                    <Text style={styles.deleteBtnText}>{t("rules.remove")}</Text>
                  </Pressable>
                )}
              </View>

              <TextInput
                style={[styles.titleInput, !editable && styles.readOnlyText]}
                value={row.title}
                onChangeText={(v) => updateRow(i, { title: v })}
                editable={editable}
                placeholder={t("rules.titlePlaceholder")}
                placeholderTextColor={colors.textPlaceholder}
              />

              <ChipGroup
                mode="select"
                options={TYPE_OPTIONS}
                value={row.type}
                onChange={(v) => editable && updateRow(i, { type: v })}
                style={styles.typeChips}
              />

              <ResizableTextInput
                value={row.text}
                onChangeText={(v) => editable && updateRow(i, { text: v })}
                style={styles.textInput}
                resetOn={false}
              />

              {row.action === "update" && row.previousText && (
                <Text style={styles.previousText} numberOfLines={2}>
                  {t("rules.previousLabel", { text: row.previousText })}
                </Text>
              )}

              {status?.state === "error" && (
                <Text style={styles.errorText}>{status.message}</Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function StatusIcon({
  status,
  styles,
  primaryColor,
}: {
  status: ImportRowStatus | undefined;
  styles: ReturnType<typeof makeStyles>;
  primaryColor: string;
}) {
  if (!status || status.state === "pending") {
    return null;
  }
  if (status.state === "importing") {
    return <ActivityIndicator size="small" color={primaryColor} />;
  }
  if (status.state === "success") {
    return <Text style={styles.statusSuccess}>✓</Text>;
  }
  return <Text style={styles.statusError}>✗</Text>;
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      gap: space[3],
    },
    pickerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[3],
    },
    pickerLabel: {
      ...type.bodySmall,
      color: colors.textMuted,
    },
    pickSubtitle: {
      ...type.caption,
      color: colors.textMuted,
    },
    pasteInput: {
      minHeight: 160,
    },
    wipeToggleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[2],
    },
    wipeToggleLabel: {
      ...type.caption,
      color: colors.textSecondary,
      flexShrink: 1,
    },
    pickButton: {
      alignSelf: "flex-start",
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingVertical: space[2],
      paddingHorizontal: space[6],
    },
    pickButtonDisabled: {
      opacity: 0.4,
    },
    pickButtonText: {
      ...type.button,
      color: colors.onAccent,
    },
    pickError: {
      ...type.caption,
      color: colors.error,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: space[3],
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      ...type.h3,
      color: colors.text,
      flexShrink: 1,
    },
    headerActions: {
      flexDirection: "row",
      gap: space[2],
    },
    secondaryButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: space[2],
      paddingHorizontal: space[4],
    },
    secondaryButtonText: {
      ...type.bodySmall,
      color: colors.textSecondary,
    },
    importButton: {
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingVertical: space[2],
      paddingHorizontal: space[4],
    },
    importButtonDisabled: {
      opacity: 0.4,
    },
    importButtonText: {
      ...type.bodySmall,
      color: colors.onAccent,
    },
    cancelButton: {
      borderWidth: 1,
      borderColor: colors.error,
      borderRadius: 8,
      paddingVertical: space[2],
      paddingHorizontal: space[4],
    },
    cancelButtonText: {
      ...type.bodySmall,
      color: colors.error,
      fontWeight: "600",
    },
    progressWrap: {
      paddingVertical: space[2],
    },
    scroll: {
      flex: 1,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: inset.card,
      marginBottom: space[3],
      gap: space[2],
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[2],
    },
    actionBadge: {
      borderRadius: 6,
      paddingVertical: 2,
      paddingHorizontal: space[2],
      backgroundColor: colors.surfaceHigh,
    },
    actionBadgeCreate: {
      backgroundColor: colors.success + "22",
    },
    actionBadgeUpdate: {
      backgroundColor: colors.accent + "22",
    },
    actionBadgeUnchanged: {
      backgroundColor: colors.border,
    },
    actionBadgeText: {
      ...type.caption,
      color: colors.textSecondary,
      fontWeight: "700",
    },
    cardHeaderSpacer: {
      flex: 1,
    },
    forceBtn: {
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: 6,
      paddingVertical: 2,
      paddingHorizontal: space[2],
    },
    forceBtnText: {
      ...type.caption,
      color: colors.accent,
      fontWeight: "600",
    },
    deleteBtn: {},
    deleteBtnText: {
      ...type.caption,
      color: colors.error,
      fontWeight: "600",
    },
    titleInput: {
      ...type.bodySmall,
      color: colors.text,
      fontWeight: "700",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      paddingVertical: 6,
      paddingHorizontal: space[2],
    },
    readOnlyText: {
      borderColor: "transparent",
      paddingHorizontal: 0,
    },
    typeChips: {},
    textInput: {
      ...type.body,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      paddingHorizontal: space[2],
    },
    previousText: {
      ...type.caption,
      color: colors.textMuted,
      fontStyle: "italic",
    },
    errorText: {
      ...type.caption,
      color: colors.error,
    },
    statusSuccess: {
      color: colors.success,
      fontSize: 14,
      fontWeight: "700",
    },
    statusError: {
      color: colors.error,
      fontSize: 14,
      fontWeight: "700",
    },
  });
}
