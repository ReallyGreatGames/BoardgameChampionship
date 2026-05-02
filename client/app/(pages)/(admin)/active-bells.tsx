import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { useTableBellActions } from "@/lib/hooks/useTableBellActions";
import { TableBell } from "@/lib/models/table-bell";
import { useTableBellStore } from "@/lib/stores/appwrite/table-bell-store";
import { inset } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { formatElapsed } from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


export default function ActiveBellsPage() {
  const { user, loading, isAdmin } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["activeBells"]);
  const tableBellStore = useTableBellStore();
  const bellActions = useTableBellActions();
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) router.replace("/(pages)/login");
  }, [loading, isAdmin]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const sorted = useMemo(() => {
    return [...tableBellStore.collection].sort((a, b) => {
      const aAck = !!a.acknowledgeTime;
      const bAck = !!b.acknowledgeTime;
      if (aAck !== bAck) return aAck ? 1 : -1;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  }, [tableBellStore.collection]);


  async function handleBellPress(bell: TableBell) {
    if (bell.acknowledgeTime) {
      await bellActions.dismiss(bell, {
        title: t("confirmDelete.title"),
        message: t("confirmDelete.message"),
        confirmLabel: t("confirmDelete.confirm"),
        cancelLabel: t("confirmDelete.cancel"),
        destructive: true,
      });
    } else {
      await bellActions.acknowledge(bell, {
        title: t("confirmAcknowledge.title"),
        message: t("confirmAcknowledge.message"),
        confirmLabel: t("confirmAcknowledge.confirm"),
        cancelLabel: t("confirmAcknowledge.cancel"),
      });
    }
  }

  if (loading || !user || !isAdmin) return null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {sorted.length === 0 ? (
          <Text style={styles.empty}>{t("empty")}</Text>
        ) : (
          sorted.map((bell) => {
            const isAck = !!bell.acknowledgeTime;
            const bellColor = isAck ? colors.success : colors.accent;
            const isItemLoading = bellActions.isLoadingBell(bell);
            const isLocked = !!bell.locked && !bellActions.canDelete(bell);

            return (
              <TouchableOpacity
                key={bell.$id}
                style={[
                  styles.bellBtn,
                  isAck ? styles.bellBtnSuccess : styles.bellBtnActive,
                ]}
                activeOpacity={0.7}
                onPress={() => handleBellPress(bell)}
                disabled={isItemLoading || (!!bell.acknowledgeTime && !bellActions.canDelete(bell))}
              >
                <View style={styles.bellIconRow}>
                  {isAck && (
                    <Ionicons name="walk-outline" size={24} color={bellColor} />
                  )}
                  <Ionicons
                    name={isAck ? "notifications-off-outline" : "notifications-outline"}
                    size={28}
                    color={bellColor}
                  />
                  {isLocked && (
                    <Ionicons name="lock-closed-outline" size={16} color={bellColor} />
                  )}
                </View>

                <View style={styles.bellLabelRow}>
                  <Text style={[styles.tableLabel, { color: bellColor }]}>
                    {t("table")} {bell.table}
                  </Text>
                  {isItemLoading && <ActivityIndicator size="small" color={bellColor} />}
                </View>
                {bell.reason ? (
                  <Text style={[styles.bellReason, { color: bellColor }]}>{bell.reason}</Text>
                ) : null}

                <Text style={[styles.bellTimer, { color: bellColor }]}>
                  {formatElapsed(bell.startTime, now)}
                </Text>
              </TouchableOpacity>
            );
          })
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
    header: {
      marginBottom: inset.group,
    },
    title: {
      ...type.h1,
      color: colors.text,
    },
    list: {
      paddingBottom: inset.screenBottom,
      gap: inset.list,
    },
    empty: {
      ...type.body,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: inset.section,
    },
    bellBtn: {
      width: "100%",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: inset.card,
      alignItems: "center",
      gap: 8,
    },
    bellBtnActive: {
      backgroundColor: colors.accent + "18",
      borderColor: colors.accent,
    },
    bellBtnSuccess: {
      backgroundColor: colors.success + "18",
      borderColor: colors.success,
    },
    bellIconRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    bellLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    tableLabel: {
      ...type.bodySmall,
      fontWeight: "600",
    },
    bellTimer: {
      ...type.caption,
      letterSpacing: 1,
    },
    bellReason: {
      ...type.caption,
      opacity: 0.8,
    },
  });
}
