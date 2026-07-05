import { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";

export type FailedItem = {
  id: string;
  label: string;
  message: string;
};

type ImportProgressBarProps = {
  label: string;
  total: number;
  succeeded: number;
  failedItems: FailedItem[];
  /** Whether this phase is the one currently running (vs. pending or done). */
  active: boolean;
  onRetry?: () => void;
};

export function ImportProgressBar({
  label,
  total,
  succeeded,
  failedItems,
  active,
  onRetry,
}: ImportProgressBarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const failed = failedItems.length;
  const done = succeeded + failed;
  const succeededPct = total > 0 ? succeeded / total : 0;
  const failedPct = total > 0 ? failed / total : 0;
  const isDone = total > 0 && done === total;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.statusRow}>
          {active && !isDone && (
            <ActivityIndicator size="small" color={colors.primary} />
          )}
          <Text style={[styles.count, failed > 0 && styles.countError]}>
            {done}/{total}
            {failed > 0 ? ` (${failed} failed)` : ""}
          </Text>
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.fillSuccess, { width: `${succeededPct * 100}%` }]} />
        <View
          style={[
            styles.fillError,
            { width: `${failedPct * 100}%`, left: `${succeededPct * 100}%` },
          ]}
        />
      </View>

      {failed > 0 && onRetry && (
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Retry {failed} failed</Text>
        </Pressable>
      )}

      {failed > 0 && (
        <View style={styles.errorList}>
          {failedItems.map((item) => (
            <Text key={item.id} style={styles.errorText}>
              • {item.label}: {item.message}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      gap: 4,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    label: {
      ...type.bodySmall,
      color: colors.text,
      fontWeight: "600",
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[2],
    },
    count: {
      ...type.caption,
      color: colors.textMuted,
    },
    countError: {
      color: colors.error,
    },
    track: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
      overflow: "hidden",
      position: "relative" as const,
    },
    fillSuccess: {
      position: "absolute" as const,
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: colors.success,
    },
    fillError: {
      position: "absolute" as const,
      top: 0,
      bottom: 0,
      backgroundColor: colors.error,
    },
    errorList: {
      gap: 2,
      marginTop: 2,
    },
    errorText: {
      ...type.caption,
      color: colors.error,
    },
    retryButton: {
      alignSelf: "flex-start",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.error,
      borderRadius: 6,
      paddingVertical: 4,
      paddingHorizontal: space[3],
    },
    retryButtonText: {
      ...type.caption,
      color: colors.error,
      fontWeight: "600",
    },
  });
}
