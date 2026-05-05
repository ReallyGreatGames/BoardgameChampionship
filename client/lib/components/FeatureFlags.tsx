import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import { useFeatureFlagStore } from "../stores/appwrite/feature-flag-store";
import { updateInCollection } from "../stores/real-time-store";
import { inset, space } from "../theme/spacing";
import { type } from "../theme/typography";
import { useDialog } from "./Dialog";

const COLLECTION_ID = "feature_flags";

export function FeatureFlags() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const collection = useFeatureFlagStore((s) => s.collection);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const { confirm } = useDialog();

  const hasPendingChanges = Object.keys(pending).length > 0;

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

  async function handleApply() {
    const ok = await confirm({
      title: "Apply changes",
      message: `Update ${Object.keys(pending).length} feature flag(s)?`,
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
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {collection.length === 0 && (
          <Text style={styles.emptyText}>No feature flags found.</Text>
        )}
        {collection.map((flag) => {
          const displayValue = getDisplayValue(flag.$id, flag.enabled);
          const isDirty = pending[flag.$id] !== undefined;
          return (
            <View
              key={flag.$id}
              style={[styles.row, isDirty && styles.rowDirty]}
            >
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>{flag.feature}</Text>
                <Text style={styles.rowSlug}>{flag.slug}</Text>
              </View>
              <Switch
                value={displayValue}
                onValueChange={() => toggle(flag.$id, displayValue)}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.text}
              />
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.applyButton,
            (!hasPendingChanges || saving) && styles.applyButtonDisabled,
          ]}
          onPress={handleApply}
          disabled={!hasPendingChanges || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={styles.applyButtonText}>
              Apply
              {hasPendingChanges ? ` (${Object.keys(pending).length})` : ""}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    list: {
      gap: space[2],
      paddingBottom: inset.screenBottom,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: space[3],
      paddingHorizontal: inset.card,
    },
    rowDirty: {
      borderColor: colors.accent,
    },
    rowInfo: {
      flex: 1,
      marginRight: space[4],
    },
    rowName: {
      ...type.body,
      color: colors.text,
    },
    rowSlug: {
      ...type.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    emptyText: {
      ...type.body,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: 40,
    },
    footer: {
      paddingTop: space[4],
      alignItems: "flex-end",
    },
    applyButton: {
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 20,
      minWidth: 90,
      alignItems: "center",
    },
    applyButtonDisabled: {
      opacity: 0.4,
    },
    applyButtonText: {
      ...type.button,
      color: colors.onAccent,
      fontSize: 14,
    },
  });
}
