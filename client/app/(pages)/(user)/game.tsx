import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { BackButton } from "@/lib/components/BackButton";
import { PlayerColorSetupModal } from "@/lib/components/PlayerColorSetupModal";
import { Table } from "@/lib/components/Table";
import { usePlayerTable } from "@/lib/hooks/usePlayerTable";
import { useTableBellActions } from "@/lib/hooks/useTableBellActions";
import { getItemAsync, setItemAsync } from "@/lib/secureStorage";
import { useScheduleStore } from "@/lib/stores/appwrite/schedule-store";
import { useTableBellStore } from "@/lib/stores/appwrite/table-bell-store";
import { useTableStore } from "@/lib/stores/appwrite/table-store";
import { useTimerStore } from "@/lib/stores/appwrite/timer-store";
import { resolveGameId } from "@/lib/utils";
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
  onPress: (gameId: string) => void;
  requiresActiveGame?: boolean;
};

const ACTION_BUTTONS: ActionButton[] = [
  {
    key: "lottery",
    icon: "shuffle",
    labelKey: "actions.lottery",
    onPress: (_gameId) => {},
  },
  {
    key: "rules",
    icon: "book-outline",
    labelKey: "actions.rules",
    onPress: (gameId) => router.push(`/rules?gameId=${gameId}`),
  },
  {
    key: "timer",
    icon: "timer-outline",
    labelKey: "actions.timer",
    requiresActiveGame: true,
    onPress: (gameId) => router.push(`/(pages)/(user)/timer?gameId=${gameId}`),
  },
  {
    key: "results",
    icon: "trophy-outline",
    labelKey: "actions.results",
    requiresActiveGame: true,
    onPress: (gameId) =>
      router.push(`/(pages)/(user)/results?gameId=${gameId}`),
  },
];

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function GamePage() {
  const { gameId, from } = useLocalSearchParams<{
    gameId: string;
    from: string;
  }>();
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["game"]);
  const scheduleStore = useScheduleStore();
  const tableBellStore = useTableBellStore();
  const bellActions = useTableBellActions();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const tableNumber = usePlayerTable(gameId);
  const tableStore = useTableStore();
  const timerStore = useTimerStore();

  const currentTable = useMemo(
    () =>
      tableNumber !== null
        ? tableStore.collection.find(
            (t) => t.tableNumber === tableNumber && t.game.$id === gameId,
          )
        : null,
    [tableStore.collection, tableNumber, gameId],
  );

  const [colorSetupVisible, setColorSetupVisible] = useState(false);

  const isActiveGame = useMemo(
    () => scheduleStore.collection.find((s) => s.isActive)?.gameId === gameId,
    [scheduleStore.collection, gameId],
  );

  const bell = useMemo(
    () => tableBellStore.collection.find((x) => x.table === tableNumber),
    [tableBellStore.collection, tableNumber],
  );

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      router.replace("/(pages)/login");
    }
  }, [user, loading]);

  useEffect(() => {
    if (!bell) {
      setElapsedSeconds(0);
      return;
    }
    const update = () =>
      setElapsedSeconds(
        Math.floor((Date.now() - new Date(bell.startTime).getTime()) / 1000),
      );
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [bell]);

  const handleBack = () => {
    router.replace((from as any) ?? "/(pages)/(user)/schedule");
  };

  const handleTimerPress = async () => {
    const stored = await getItemAsync(`playerColors_${gameId}`);
    if (!stored && currentTable) {
      setColorSetupVisible(true);
    } else {
      router.push(`/(pages)/(user)/timer?gameId=${gameId}`);
    }
  };

  const handleSaveSetup = async (
    playerIds: (string | null)[],
    hexColors: string[],
  ) => {
    await setItemAsync(`playerColors_${gameId}`, JSON.stringify(hexColors));

    const validIds = playerIds.filter((id): id is string => id !== null);
    const existing =
      tableNumber !== null
        ? timerStore.collection.find(
            (t) =>
              t.table === tableNumber &&
              resolveGameId(t.games) === (gameId ?? null),
          )
        : undefined;

    if (existing) {
      await timerStore.update(
        { $id: existing.$id, playerPositions: validIds as any },
        true,
      );
    } else if (tableNumber !== null) {
      await timerStore.add({
        table: tableNumber,
        games: gameId ?? null,
        playerTimes: [],
        activePlayerTimer: null,
        paused: true,
        playersInOvertime: [],
        playerPositions: validIds as any,
      });
    }

    setColorSetupVisible(false);
    router.push(`/(pages)/(user)/timer?gameId=${gameId}`);
  };

  async function toggleBell() {
    if (bell) {
      await bellActions.dismiss(bell, {
        title: t("actions.confirmDismiss.title"),
        message: t("actions.confirmDismiss.message"),
        confirmLabel: t("actions.confirmDismiss.confirm"),
        cancelLabel: t("actions.confirmDismiss.cancel"),
        destructive: true,
      });
    } else if (tableNumber !== null) {
      await bellActions.ring(tableNumber, undefined, {
        title: t("actions.confirmRing.title"),
        message: t("actions.confirmRing.message"),
        confirmLabel: t("actions.confirmRing.confirm"),
        cancelLabel: t("actions.confirmRing.cancel"),
      });
    }
  }

  const bellColor = !isActiveGame
    ? colors.textSecondary
    : bell?.acknowledgeTime
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

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        <Table gameId={gameId} />

        <View style={styles.actionsGrid}>
          {ACTION_BUTTONS.map(
            ({ key, icon, labelKey, onPress, requiresActiveGame }) => {
              const disabled = requiresActiveGame && !isActiveGame;
              const press =
                key === "timer" ? handleTimerPress : () => onPress(gameId);
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.actionBtn,
                    disabled ? styles.actionBtnDisabled : undefined,
                  ]}
                  activeOpacity={0.7}
                  onPress={press}
                  disabled={disabled}
                >
                  <Ionicons
                    name={icon}
                    size={28}
                    color={disabled ? colors.textSecondary : colors.primary}
                  />
                  <Text
                    style={[
                      styles.actionLabel,
                      disabled ? styles.actionLabelDisabled : undefined,
                    ]}
                  >
                    {t(labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            },
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.bellBtn,
            !isActiveGame
              ? styles.actionBtnDisabled
              : bell?.acknowledgeTime
                ? styles.bellBtnSuccess
                : bell
                  ? styles.bellBtnActive
                  : undefined,
          ]}
          activeOpacity={0.7}
          onPress={toggleBell}
          disabled={
            !isActiveGame ||
            bellActions.isLoading ||
            (!!bell && !bellActions.canDelete(bell))
          }
        >
          <View style={styles.bellIconRow}>
            {bell?.acknowledgeTime && (
              <Ionicons name="walk-outline" size={24} color={bellColor} />
            )}
            <Ionicons name={bellIcon} size={28} color={bellColor} />
            {!!bell && !bellActions.canDelete(bell) && (
              <Ionicons
                name="lock-closed-outline"
                size={16}
                color={bellColor}
              />
            )}
          </View>

          <View style={styles.bellLabelRow}>
            <Text style={[styles.actionLabel, { color: bellColor }]}>
              {t("actions.tableBell")}
            </Text>
            {bellActions.isLoading && (
              <ActivityIndicator size="small" color={bellColor} />
            )}
          </View>

          {bell && (
            <Text style={[styles.bellTimer, { color: bellColor }]}>
              {formatElapsed(elapsedSeconds)}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <PlayerColorSetupModal
        visible={colorSetupVisible}
        onClose={() => setColorSetupVisible(false)}
        players={currentTable?.players ?? []}
        onSave={handleSaveSetup}
        customColors={currentTable?.game.colors}
      />
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
      gap: inset.group,
    },
    actionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: inset.card,
    },
    actionBtn: {
      width: "47%",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: inset.card,
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
    actionBtnDisabled: {
      opacity: 0.4,
    },
    actionLabel: {
      ...type.bodySmall,
      color: colors.text,
      fontWeight: "600",
    },
    actionLabelDisabled: {
      color: colors.textSecondary,
    },
  });
}
