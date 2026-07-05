import * as DocumentPicker from "expo-document-picker";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { useDialog } from "@/lib/components/ui/Dialog";
import { useImportActivity } from "@/lib/components/admin/ImportActivityContext";
import {
  fetchAndValidate,
  FetchAndValidateResult,
  importTables,
  ImportRowStatus,
  ValidatedGroup,
} from "@/lib/import/table-import-service";
import { readTextFile } from "@/lib/import/read-text-file";
import { parseTableFile } from "@/lib/import/table-parser";
import {
  deleteItems,
  listTablesWipePlan,
  WipeGroup,
  WipeItemStatus,
} from "@/lib/import/wipe-service";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { ImportProgressBar } from "./ImportProgressBar";

type Phase = "pick" | "preview" | "deleting" | "importing" | "done";

type WipeStatusMap = Record<string, Record<string, WipeItemStatus>>;

function initWipeStatuses(groups: WipeGroup[]): WipeStatusMap {
  const next: WipeStatusMap = {};
  for (const g of groups) {
    next[g.key] = {};
    for (const item of g.items) {
      next[g.key][item.id] = { state: "pending" };
    }
  }
  return next;
}

function allWipeItemsSucceeded(
  statuses: WipeStatusMap,
  groups: WipeGroup[],
): boolean {
  return groups.every((g) =>
    g.items.every((item) => statuses[g.key]?.[item.id]?.state === "success"),
  );
}

export function ImportTables() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { confirm } = useDialog();
  const { setBusy } = useImportActivity();

  const [phase, setPhase] = useState<Phase>("pick");
  const [loading, setLoading] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);
  const [validation, setValidation] = useState<FetchAndValidateResult | null>(
    null,
  );
  const [statuses, setStatuses] = useState<ImportRowStatus[][]>([]);

  const [wipeGroups, setWipeGroups] = useState<WipeGroup[]>([]);
  const [wipeStatuses, setWipeStatuses] = useState<WipeStatusMap>({});
  const [activeWipeGroup, setActiveWipeGroup] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const cancelRequestedRef = useRef(false);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  // Block leaving the import tabs while a delete/import run is active — the
  // user must cancel or let it finish, since unmounting mid-run silently
  // aborts it.
  useEffect(() => {
    setBusy(phase === "deleting" || phase === "importing");
    return () => setBusy(false);
  }, [phase, setBusy]);

  const totalEntries =
    validation?.groups.reduce((sum, g) => sum + g.entries.length, 0) ?? 0;
  const successCount = statuses
    .flat()
    .filter((s) => s.state === "success").length;
  const errorCount = statuses.flat().filter((s) => s.state === "error").length;

  async function handlePickFile() {
    setPickError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/plain", "*/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const text = await readTextFile(asset.uri);

      const parsed = parseTableFile(text);
      setLoading(true);
      const validationResult = await fetchAndValidate(parsed.groups);
      if (!mountedRef.current) {
        return;
      }
      setValidation(validationResult);
      setStatuses(
        validationResult.groups.map((g) => g.entries.map(() => ({ state: "pending" }))),
      );
      setLoading(false);
      setPhase("preview");
    } catch (e: unknown) {
      setLoading(false);
      setPickError(e instanceof Error ? e.message : "Failed to read file");
    }
  }

  async function runWipeGroup(group: WipeGroup, local: WipeStatusMap) {
    setActiveWipeGroup(group.key);
    await deleteItems(
      group.tableId,
      group.items,
      (itemId, status) => {
        local[group.key] = { ...local[group.key], [itemId]: status };
        setWipeStatuses({ ...local });
      },
      () => mountedRef.current && !cancelRequestedRef.current,
    );
  }

  function cancelDeleting() {
    cancelRequestedRef.current = true;
    setWipeStatuses((prev) => {
      const next: WipeStatusMap = {};
      for (const g of wipeGroups) {
        next[g.key] = { ...prev[g.key] };
        for (const item of g.items) {
          if (next[g.key][item.id]?.state === "pending") {
            next[g.key][item.id] = { state: "error", message: "Cancelled" };
          }
        }
      }
      return next;
    });
  }

  function cancelImporting() {
    cancelRequestedRef.current = true;
    setStatuses((prev) =>
      prev.map((row) =>
        row.map((s) =>
          s.state === "pending"
            ? { state: "error", message: "Cancelled" }
            : s,
        ),
      ),
    );
    setPhase("done");
  }

  async function runImport() {
    if (!validation) {
      return;
    }
    cancelRequestedRef.current = false;
    setPhase("importing");

    await importTables(
      validation.groups,
      validation.playersByCode,
      (g, e, status) => {
        if (!mountedRef.current) {
          return;
        }
        setStatuses((prev) => {
          const next = prev.map((row) => [...row]);
          next[g][e] = status;
          return next;
        });
      },
      () => mountedRef.current && !cancelRequestedRef.current,
    );

    if (mountedRef.current) {
      setPhase("done");
    }
  }

  async function retryFailedEntriesInGroup(g: number) {
    if (!validation) {
      return;
    }
    const group = validation.groups[g];
    const failedEntryIndices = group.entries
      .map((_, e) => e)
      .filter((e) => statuses[g]?.[e]?.state === "error");
    if (failedEntryIndices.length === 0) {
      return;
    }

    const retryGroup: ValidatedGroup = {
      ...group,
      entries: failedEntryIndices.map((e) => group.entries[e]),
    };

    cancelRequestedRef.current = false;
    setPhase("importing");
    await importTables(
      [retryGroup],
      validation.playersByCode,
      (_rg, re, status) => {
        if (!mountedRef.current) {
          return;
        }
        const e = failedEntryIndices[re];
        setStatuses((prev) => {
          const next = prev.map((row) => [...row]);
          next[g][e] = status;
          return next;
        });
      },
      () => mountedRef.current && !cancelRequestedRef.current,
    );

    if (mountedRef.current) {
      setPhase("done");
    }
  }

  async function handleImportClick() {
    const ok = await confirm({
      title: "Replace all table seatings?",
      message:
        "This will permanently delete all existing table seatings and " +
        "timers, then import the seating assignments from this file. This " +
        "cannot be undone.",
      confirmLabel: "Delete & Import",
      destructive: true,
    });
    if (!ok) {
      return;
    }

    cancelRequestedRef.current = false;
    const groups = await listTablesWipePlan();
    if (!mountedRef.current) {
      return;
    }
    setWipeGroups(groups);
    const local = initWipeStatuses(groups);
    setWipeStatuses(local);
    setPhase("deleting");

    for (const group of groups) {
      if (!mountedRef.current) {
        return;
      }
      if (cancelRequestedRef.current) {
        break;
      }
      await runWipeGroup(group, local);
    }
    setActiveWipeGroup(null);
    if (!mountedRef.current) {
      return;
    }

    if (allWipeItemsSucceeded(local, groups)) {
      await runImport();
    }
  }

  async function retryWipeGroup(groupKey: string) {
    const group = wipeGroups.find((g) => g.key === groupKey);
    if (!group) {
      return;
    }
    const failedItems = group.items.filter(
      (item) => wipeStatuses[groupKey]?.[item.id]?.state === "error",
    );
    if (failedItems.length === 0) {
      return;
    }

    cancelRequestedRef.current = false;
    const local: WipeStatusMap = { ...wipeStatuses };
    await runWipeGroup({ ...group, items: failedItems }, local);
    setActiveWipeGroup(null);
    if (!mountedRef.current) {
      return;
    }

    if (allWipeItemsSucceeded(local, wipeGroups)) {
      await runImport();
    }
  }

  async function handleImportAnyway() {
    await runImport();
  }

  function handleReset() {
    setPhase("pick");
    setLoading(false);
    setPickError(null);
    setValidation(null);
    setStatuses([]);
    setWipeGroups([]);
    setWipeStatuses({});
    setActiveWipeGroup(null);
  }

  if (phase === "pick") {
    return (
      <View style={styles.centered}>
        <Text style={styles.pickTitle}>Import table seating</Text>
        <Text style={styles.pickSubtitle}>
          Select a text file where each line has the format:{"\n"}
          {"  1 |  1  AT2-4 BE2-1 GB2-1 FI3-3"}
        </Text>
        <Pressable
          style={[styles.pickButton, loading && styles.pickButtonDisabled]}
          onPress={handlePickFile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.onAccent} />
          ) : (
            <Text style={styles.pickButtonText}>Pick file</Text>
          )}
        </Pressable>
        {pickError && <Text style={styles.pickError}>{pickError}</Text>}
      </View>
    );
  }

  if (phase === "deleting") {
    const wipeIdle = activeWipeGroup === null;
    const hasWipeFailures = wipeGroups.some((g) =>
      Object.values(wipeStatuses[g.key] ?? {}).some((s) => s.state === "error"),
    );

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Deleting existing data…</Text>
          <View style={styles.headerActions}>
            {wipeIdle && hasWipeFailures && (
              <Pressable
                style={styles.bypassButton}
                onPress={handleImportAnyway}
              >
                <Text style={styles.bypassButtonText}>
                  Skip failed deletions & import anyway
                </Text>
              </Pressable>
            )}
            <Pressable style={styles.cancelButton} onPress={cancelDeleting}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
        <ScrollView
          style={styles.tableScroll}
          contentContainerStyle={styles.wipeList}
          showsVerticalScrollIndicator={false}
        >
          {wipeGroups.map((group) => {
            const groupStatuses = wipeStatuses[group.key] ?? {};
            const succeeded = Object.values(groupStatuses).filter(
              (s) => s.state === "success",
            ).length;
            const failedItems = group.items.flatMap((item) => {
              const status = groupStatuses[item.id];
              return status?.state === "error"
                ? [{ id: item.id, label: item.label, message: status.message }]
                : [];
            });
            return (
              <ImportProgressBar
                key={group.key}
                label={group.label}
                total={group.items.length}
                succeeded={succeeded}
                failedItems={failedItems}
                active={activeWipeGroup === group.key}
                onRetry={
                  failedItems.length > 0
                    ? () => retryWipeGroup(group.key)
                    : undefined
                }
              />
            );
          })}
        </ScrollView>
      </View>
    );
  }

  const groups = validation?.groups ?? [];
  const globalErrors = validation?.globalErrors ?? [];
  const hasErrors = validation?.hasErrors ?? false;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {phase === "preview" &&
            `Preview — ${groups.length} games, ${totalEntries} tables`}
          {phase === "importing" &&
            `Importing… ${successCount + errorCount}/${totalEntries}`}
          {phase === "done" &&
            `Done — ${successCount} succeeded, ${errorCount} failed`}
        </Text>

        <View style={styles.headerActions}>
          {phase === "preview" && (
            <>
              <Pressable style={styles.secondaryButton} onPress={handleReset}>
                <Text style={styles.secondaryButtonText}>Pick another</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.importButton,
                  hasErrors && styles.importButtonDisabled,
                ]}
                onPress={handleImportClick}
                disabled={hasErrors}
              >
                <Text style={styles.importButtonText}>
                  {hasErrors
                    ? "Fix errors first"
                    : `Import ${totalEntries} tables`}
                </Text>
              </Pressable>
            </>
          )}
          {phase === "importing" && (
            <Pressable style={styles.cancelButton} onPress={cancelImporting}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          )}
          {phase === "done" && (
            <Pressable style={styles.secondaryButton} onPress={handleReset}>
              <Text style={styles.secondaryButtonText}>
                Import another file
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {(phase === "importing" || phase === "done") && (
        <View style={styles.wipeList}>
          {groups.map((group, g) => {
            const groupStatuses = statuses[g] ?? [];
            const succeeded = groupStatuses.filter(
              (s) => s.state === "success",
            ).length;
            const failedItems = group.entries.flatMap((entry, e) => {
              const status = groupStatuses[e];
              return status?.state === "error"
                ? [
                    {
                      id: String(entry.line),
                      label: `Table ${entry.tableNumber}`,
                      message: status.message,
                    },
                  ]
                : [];
            });
            return (
              <ImportProgressBar
                key={g}
                label={group.gameTitle}
                total={group.entries.length}
                succeeded={succeeded}
                failedItems={failedItems}
                active={phase === "importing"}
                onRetry={
                  failedItems.length > 0
                    ? () => retryFailedEntriesInGroup(g)
                    : undefined
                }
              />
            );
          })}
        </View>
      )}

      {globalErrors.length > 0 && (
        <View style={styles.globalErrorBox}>
          {globalErrors.map((err, i) => (
            <Text key={i} style={styles.globalErrorText}>
              • {err}
            </Text>
          ))}
        </View>
      )}

      <ScrollView
        style={styles.tableScroll}
        showsVerticalScrollIndicator={false}
      >
        {groups.map((group, g) => (
          <GameGroup
            key={g}
            group={group}
            statuses={statuses[g] ?? []}
            styles={styles}
            primaryColor={colors.primary}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function GameGroup({
  group,
  statuses,
  styles,
  primaryColor,
}: {
  group: ValidatedGroup;
  statuses: ImportRowStatus[];
  styles: ReturnType<typeof makeStyles>;
  primaryColor: string;
}) {
  return (
    <View style={styles.gameGroup}>
      <Text style={styles.gameGroupTitle}>{group.gameTitle}</Text>

      <View style={styles.tableHeader}>
        <Text style={[styles.colStatus, styles.colHeaderText]}></Text>
        <Text style={[styles.colTable, styles.colHeaderText]}>Table</Text>
        <Text style={[styles.colPlayers, styles.colHeaderText]}>Players</Text>
      </View>

      {group.entries.map((entry, e) => {
        const status = statuses[e];
        const hasRowErrors = entry.errors.length > 0;

        return (
          <View key={entry.line}>
            <View
              style={[
                styles.tableRow,
                hasRowErrors && styles.tableRowError,
                status?.state === "success" && styles.tableRowSuccess,
                status?.state === "error" && styles.tableRowError,
              ]}
            >
              <View style={styles.colStatus}>
                <StatusIcon
                  status={status}
                  styles={styles}
                  primaryColor={primaryColor}
                />
              </View>
              <Text style={[styles.colTable, styles.cellText]}>
                {entry.tableNumber}
              </Text>
              <Text
                style={[styles.colPlayers, styles.cellText]}
                numberOfLines={1}
              >
                {entry.playerCodes.join("  ")}
              </Text>
            </View>

            {hasRowErrors && (
              <View style={styles.errorRow}>
                {entry.errors.map((err, j) => (
                  <Text key={j} style={styles.errorText}>
                    • {err}
                  </Text>
                ))}
              </View>
            )}

            {status?.state === "error" && (
              <View style={styles.errorRow}>
                <Text style={styles.errorText}>• {status.message}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function StatusIcon({
  status,
  styles,
  primaryColor,
}: {
  status: ImportRowStatus;
  styles: ReturnType<typeof makeStyles>;
  primaryColor: string;
}) {
  if (!status || status.state === "pending") {
    return <View style={styles.statusPlaceholder} />;
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
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: space[4],
    },
    pickTitle: {
      ...type.h2,
      color: colors.text,
    },
    pickSubtitle: {
      ...type.body,
      color: colors.textMuted,
      textAlign: "center",
      maxWidth: 480,
    },
    pickButton: {
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingVertical: space[3],
      paddingHorizontal: space[6],
      minWidth: 120,
      alignItems: "center",
    },
    pickButtonDisabled: {
      opacity: 0.6,
    },
    pickButtonText: {
      ...type.button,
      color: colors.onAccent,
    },
    pickError: {
      ...type.caption,
      color: colors.error,
      textAlign: "center",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: space[3],
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: space[3],
    },
    headerTitle: {
      ...type.h3,
      color: colors.text,
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
    bypassButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: space[2],
      paddingHorizontal: space[4],
    },
    bypassButtonText: {
      ...type.bodySmall,
      color: colors.textSecondary,
      fontWeight: "600",
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
    globalErrorBox: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.error,
      borderRadius: 8,
      padding: inset.card,
      marginBottom: space[3],
    },
    globalErrorText: {
      ...type.bodySmall,
      color: colors.error,
    },
    tableScroll: {
      flex: 1,
    },
    wipeList: {
      gap: space[4],
      paddingVertical: space[2],
    },
    gameGroup: {
      marginBottom: space[5],
    },
    gameGroupTitle: {
      ...type.h3,
      color: colors.text,
      marginBottom: space[2],
    },
    tableHeader: {
      flexDirection: "row",
      paddingVertical: space[2],
      paddingHorizontal: inset.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: space[1],
    },
    colHeaderText: {
      ...type.eyebrow,
      color: colors.textMuted,
    },
    tableRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: space[2],
      paddingHorizontal: inset.card,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      marginBottom: 2,
    },
    tableRowError: {
      borderColor: colors.error,
    },
    tableRowSuccess: {
      borderColor: colors.success,
    },
    cellText: {
      ...type.bodySmall,
      color: colors.text,
    },
    errorRow: {
      paddingHorizontal: inset.card,
      paddingBottom: space[2],
      marginTop: -2,
      marginBottom: 2,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderTopWidth: 0,
      borderColor: colors.error,
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
    },
    errorText: {
      ...type.caption,
      color: colors.error,
    },
    colStatus: {
      width: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    colTable: {
      width: 52,
      marginRight: space[2],
    },
    colPlayers: {
      flex: 1,
    },
    statusPlaceholder: {
      width: 16,
      height: 16,
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
