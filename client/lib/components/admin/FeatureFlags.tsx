import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { useFeatureFlagStore } from "@/lib/stores/appwrite/feature-flag-store";
import { updateInCollection } from "@/lib/stores/real-time-store";
import { inset } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { useDialog } from "@/lib/components/ui/Dialog";

const COLLECTION_ID = "feature_flags";

export function FeatureFlags() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["components"]);
  const collection = useFeatureFlagStore((s) => s.collection);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const { confirm } = useDialog();

  const pendingCount = Object.keys(pending).length;
  const hasPendingChanges = pendingCount > 0;

  function toggle(id: string, currentValue: boolean) {
    setPending((prev) => {
      const next = { ...prev };
      next[id] = !currentValue;
      return next;
    });
  }

  function getDisplayValue(id: string, storedValue: boolean): boolean {
    return pending[id] !== undefined ? pending[id] : storedValue;
  }

  async function handleSave() {
    const ok = await confirm({
      title: t("tournamentSettings.featureFlagsSaveTitle"),
      message: t("tournamentSettings.featureFlagsSaveMessage", {
        count: pendingCount,
      }),
    });

    if (ok) {
      setSaving(true);
      const updates = Object.entries(pending).map(([id, enabled]) =>
        updateInCollection(COLLECTION_ID, { $id: id, enabled }),
      );
      await Promise.all(updates);
      setPending({});
      setSaving(false);
    }
  }

  return (
    <View style={styles.card}>
      {collection.length === 0 && (
        <Text style={styles.emptyText}>
          {t("tournamentSettings.featureFlagsEmpty")}
        </Text>
      )}
      {collection.map((flag) => {
        const displayValue = getDisplayValue(flag.$id, flag.enabled);
        const isDirty = pending[flag.$id] !== undefined;
        return (
          <View key={flag.$id} style={styles.fieldRow}>
            <Text
              style={[styles.fieldLabel, isDirty && styles.fieldLabelDirty]}
            >
              {flag.feature}
            </Text>
            <Switch
              value={displayValue}
              onValueChange={() => toggle(flag.$id, displayValue)}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.text}
            />
          </View>
        );
      })}

      <View style={styles.cardFooter}>
        <Pressable
          style={[
            styles.saveButton,
            (!hasPendingChanges || saving) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!hasPendingChanges || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={styles.saveButtonText}>
              {t("tournamentSettings.save")}
              {hasPendingChanges ? ` (${pendingCount})` : ""}
            </Text>
          )}
        </Pressable>
      </View>
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
      padding: inset.card,
      overflow: "hidden",
    },
    fieldRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    fieldLabel: {
      ...type.bodySmall,
      color: colors.textSecondary,
    },
    fieldLabelDirty: {
      color: colors.accent,
    },
    emptyText: {
      ...type.body,
      color: colors.textMuted,
      textAlign: "center",
      marginVertical: 12,
    },
    cardFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 12,
      marginTop: 12,
    },
    saveButton: {
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 20,
      minWidth: 72,
      alignItems: "center",
    },
    saveButtonDisabled: {
      opacity: 0.4,
    },
    saveButtonText: {
      ...type.button,
      color: colors.onAccent,
      fontSize: 14,
    },
  });
}
