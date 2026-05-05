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
import { importTeam, ImportRowStatus, prefetchExisting } from "../import/import-service";
import { parseTsv, ParsedRow } from "../import/tsv-parser";
import { inset, space } from "../theme/spacing";
import { type } from "../theme/typography";

type Phase = "pick" | "preview" | "importing" | "done";

export function ImportPlayers() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [phase, setPhase] = useState<Phase>("pick");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [statuses, setStatuses] = useState<ImportRowStatus[]>([]);
  const [pickError, setPickError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const hasErrors = rows.some((r) => r.errors.length > 0);

  async function handlePickFile() {
    setPickError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/tab-separated-values", "text/plain", "*/*"],
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

      const parsed = parseTsv(text);
      setRows(parsed);
      setStatuses(parsed.map(() => ({ state: "pending" })));
      setPhase("preview");
    } catch (e: unknown) {
      setPickError(e instanceof Error ? e.message : "Failed to read file");
    }
  }

  async function handleImport() {
    setPhase("importing");

    const { teamsByCode, playersByTeamAndNumber } = await prefetchExisting();

    for (let i = 0; i < rows.length; i++) {
      if (!mountedRef.current) {
        return;
      }
      await importTeam(rows[i].team, teamsByCode, playersByTeamAndNumber, (status) => {
        setStatuses((prev) => {
          const next = [...prev];
          next[i] = status;
          return next;
        });
      });
    }

    if (mountedRef.current) {
      setPhase("done");
    }
  }

  function handleReset() {
    setPhase("pick");
    setRows([]);
    setStatuses([]);
    setPickError(null);
  }

  if (phase === "pick") {
    return (
      <View style={styles.centered}>
        <Text style={styles.pickTitle}>Import teams & players</Text>
        <Text style={styles.pickSubtitle}>
          Select a TSV file with 8 columns: team name, country, player 1–4, team code, country code
        </Text>
        <Pressable style={styles.pickButton} onPress={handlePickFile}>
          <Text style={styles.pickButtonText}>Pick TSV file</Text>
        </Pressable>
        {pickError && <Text style={styles.pickError}>{pickError}</Text>}
      </View>
    );
  }

  const successCount = statuses.filter((s) => s.state === "success").length;
  const errorCount = statuses.filter((s) => s.state === "error").length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {phase === "preview" && `Preview — ${rows.length} teams`}
          {phase === "importing" && `Importing… ${successCount + errorCount}/${rows.length}`}
          {phase === "done" && `Done — ${successCount} succeeded, ${errorCount} failed`}
        </Text>

        <View style={styles.headerActions}>
          {phase === "preview" && (
            <>
              <Pressable style={styles.secondaryButton} onPress={handleReset}>
                <Text style={styles.secondaryButtonText}>Pick another</Text>
              </Pressable>
              <Pressable
                style={[styles.importButton, hasErrors && styles.importButtonDisabled]}
                onPress={handleImport}
                disabled={hasErrors}
              >
                <Text style={styles.importButtonText}>
                  {hasErrors ? "Fix errors first" : `Import ${rows.length} teams`}
                </Text>
              </Pressable>
            </>
          )}
          {phase === "done" && (
            <Pressable style={styles.secondaryButton} onPress={handleReset}>
              <Text style={styles.secondaryButtonText}>Import another file</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView style={styles.tableScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.tableHeader}>
          <Text style={[styles.colStatus, styles.colHeaderText]}></Text>
          <Text style={[styles.colCode, styles.colHeaderText]}>Code</Text>
          <Text style={[styles.colName, styles.colHeaderText]}>Team</Text>
          <Text style={[styles.colCountry, styles.colHeaderText]}>CC</Text>
          <Text style={[styles.colPlayers, styles.colHeaderText]}>Players</Text>
        </View>

        {rows.map((row, i) => {
          const status = statuses[i];
          const hasRowErrors = row.errors.length > 0;

          return (
            <View key={String(row.line)}>
              <View
                style={[
                  styles.tableRow,
                  hasRowErrors && styles.tableRowError,
                  status?.state === "success" && styles.tableRowSuccess,
                  status?.state === "error" && styles.tableRowError,
                ]}
              >
                <View style={styles.colStatus}>
                  <StatusIcon status={status} styles={styles} primaryColor={colors.primary} />
                </View>
                <Text style={[styles.colCode, styles.cellText]} numberOfLines={1}>
                  {row.team.code}
                </Text>
                <Text style={[styles.colName, styles.cellText]} numberOfLines={1}>
                  {row.team.name}
                </Text>
                <Text style={[styles.colCountry, styles.cellText]} numberOfLines={1}>
                  {row.team.country}
                </Text>
                <View style={styles.colPlayers}>
                  {row.team.players.map((p) => (
                    <Text key={p.playerNumber} style={styles.playerText} numberOfLines={1}>
                      {p.playerNumber}. {p.name}
                    </Text>
                  ))}
                </View>
              </View>

              {hasRowErrors && (
                <View style={styles.errorRow}>
                  {row.errors.map((err, j) => (
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
      </ScrollView>
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
    tableScroll: {
      flex: 1,
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
      alignItems: "flex-start",
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
    playerText: {
      ...type.caption,
      color: colors.textSecondary,
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
      paddingTop: 2,
    },
    colCode: {
      width: 60,
      marginRight: space[2],
    },
    colName: {
      flex: 2,
      marginRight: space[2],
    },
    colCountry: {
      width: 36,
      marginRight: space[2],
    },
    colPlayers: {
      flex: 3,
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
