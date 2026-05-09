import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system/next";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import {
  fetchAndValidate,
  FetchAndValidateResult,
  importTables,
  ImportRowStatus,
  ValidatedGroup,
} from "../import/table-import-service";
import { parseTableFile } from "../import/table-parser";
import { inset, space } from "../theme/spacing";
import { type } from "../theme/typography";

type Phase = "pick" | "preview" | "importing" | "done";

export function ImportTables() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [phase, setPhase] = useState<Phase>("pick");
  const [loading, setLoading] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);
  const [validation, setValidation] = useState<FetchAndValidateResult | null>(
    null,
  );
  const [statuses, setStatuses] = useState<ImportRowStatus[][]>([]);

  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

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
      let text: string;

      if (Platform.OS === "web") {
        const response = await fetch(asset.uri);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        text = await response.text();
      } else {
        text = await new File(asset.uri).text();
      }

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

  async function handleImport() {
    if (!validation) {
      return;
    }
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
    );

    if (mountedRef.current) {
      setPhase("done");
    }
  }

  function handleReset() {
    setPhase("pick");
    setLoading(false);
    setPickError(null);
    setValidation(null);
    setStatuses([]);
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
                onPress={handleImport}
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
          {phase === "done" && (
            <Pressable style={styles.secondaryButton} onPress={handleReset}>
              <Text style={styles.secondaryButtonText}>
                Import another file
              </Text>
            </Pressable>
          )}
        </View>
      </View>

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
