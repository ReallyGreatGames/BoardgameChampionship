import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { BackButton } from "@/lib/components/BackButton";
import { useDialog } from "@/lib/components/Dialog";
import { Table } from "@/lib/components/Table";
import { useTableBellStore } from "@/lib/stores/appwrite/table-bell-store";
import { inset } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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

type ActionButton = {
  key: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  labelKey: string;
};

const ACTION_BUTTONS: ActionButton[] = [
  { key: "lottery", icon: "shuffle", labelKey: "actions.lottery" },
  { key: "rules", icon: "book-outline", labelKey: "actions.rules" },
  { key: "timer", icon: "timer-outline", labelKey: "actions.timer" },
  { key: "results", icon: "trophy-outline", labelKey: "actions.results" },
];

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function GamePage() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["game"]);
  const tableBellStore = useTableBellStore();
  const { confirm } = useDialog();
  const [bellLoading, setBellLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // ! TODO: Get Table To Game
  const table = 1;
  const bell = useMemo(
    () => tableBellStore.collection.find((x) => x.table === table),
    [tableBellStore.collection],
  );

  useEffect(() => {
    tableBellStore.init();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/(pages)/login");
  }, [user, loading]);

  useEffect(() => {
    if (!bell) {
      setElapsedSeconds(0);
      return;
    }
    const update = () =>
      setElapsedSeconds(Math.floor((Date.now() - new Date(bell.startTime).getTime()) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [bell]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(pages)/(user)/schedule");
  };

  async function toggleBell() {
    try {
      if (bell) {
        const ok = await confirm({
          title: t("actions.confirmDismiss.title"),
          message: t("actions.confirmDismiss.message"),
          confirmLabel: t("actions.confirmDismiss.confirm"),
          cancelLabel: t("actions.confirmDismiss.cancel"),
          destructive: true,
        });
        if (!ok) return;
        setBellLoading(true);

        await tableBellStore.delete(bell);

      } else {
        const ok = await confirm({
          title: t("actions.confirmRing.title"),
          message: t("actions.confirmRing.message"),
          confirmLabel: t("actions.confirmRing.confirm"),
          cancelLabel: t("actions.confirmRing.cancel"),
        });
        if (!ok) return;
        setBellLoading(true);
        await tableBellStore.add({ table, startTime: new Date().toISOString() });
      }
    } finally {
      setBellLoading(false);
    }
  }

  const bellColor = bell?.acknowledgeTime
    ? colors.success
    : bell
      ? colors.accent
      : colors.primary;

  const bellIcon: React.ComponentProps<typeof Ionicons>["name"] = bell
    ? "notifications-off-outline"
    : "notifications-outline";

  return (
    <View style={styles.container}>
      <BackButton onPress={handleBack} />

      <View style={styles.header}>
        <Text style={styles.title}>{t("title")}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <Table gameId={gameId} />

        <View style={styles.actionsGrid}>
          {ACTION_BUTTONS.map(({ key, icon, labelKey }) => (
            <TouchableOpacity key={key} style={styles.actionBtn} activeOpacity={0.7}>
              <Ionicons name={icon} size={28} color={colors.primary} />
              <Text style={styles.actionLabel}>{t(labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.bellBtn,
            bell?.acknowledgeTime
              ? styles.bellBtnSuccess
              : bell
                ? styles.bellBtnActive
                : undefined,
          ]}
          activeOpacity={0.7}
          onPress={toggleBell}
          disabled={bellLoading}
        >
          <View style={styles.bellIconRow}>
            {bell?.acknowledgeTime && (
              <Ionicons name="walk-outline" size={24} color={bellColor} />
            )}
            <Ionicons name={bellIcon} size={28} color={bellColor} />
          </View>

          <View style={styles.bellLabelRow}>
            <Text style={[styles.actionLabel, { color: bellColor }]}>
              {t("actions.tableBell")}
            </Text>
            {bellLoading && <ActivityIndicator size="small" color={bellColor} />}
          </View>

          {bell && (
            <Text style={[styles.bellTimer, { color: bellColor }]}>
              {formatElapsed(elapsedSeconds)}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 24,
      paddingTop: 32,
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
      gap: inset.group,
    },
    actionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: inset.card,
    },
    actionBtn: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      gap: inset.tight,
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
    bellTimer: {
      ...type.caption,
      letterSpacing: 1,
    },
    actionLabel: {
      ...type.bodySmall,
      color: colors.text,
      fontWeight: "600",
    },
  });
}
