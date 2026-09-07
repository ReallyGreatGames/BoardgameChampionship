import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { BackButton } from "@/lib/components/ui/BackButton";
import { Badge } from "@/lib/components/ui/Badge";
import { GameActionRow, type GameAction } from "@/lib/components/game/GameActionRow";
import { GameHeader } from "@/lib/components/game/GameHeader";
import { GameSeatingList } from "@/lib/components/game/GameSeatingList";
import { PlayerColorSetupModal } from "@/lib/components/onboarding/PlayerColorSetupModal";
import { PlayerSelectionCard } from "@/lib/components/ui/PlayerSelectionCard";
import { TableBellBar, type TableBellState } from "@/lib/components/game/TableBellBar";
import { FeatureFlagSlugs } from "@/lib/feature-flags/feature-flag-slugs";
import { useFeatureFlags } from "@/lib/feature-flags/useFeatureFlags";
import { useGameScheduleInfo } from "@/lib/hooks/useGameScheduleInfo";
import { usePlayerTable } from "@/lib/hooks/usePlayerTable";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useTableBellActions } from "@/lib/hooks/useTableBellActions";
import { getItemAsync, setItemAsync } from "@/lib/secureStorage";
import { useLotteryStore } from "@/lib/stores/appwrite/lottery-store";
import { useOptionsLotteryStore } from "@/lib/stores/appwrite/options-lottery-store";
import { useTableBellStore } from "@/lib/stores/appwrite/table-bell-store";
import { useTableStore } from "@/lib/stores/appwrite/table-store";
import { useTimerStore } from "@/lib/stores/appwrite/timer-store";
import { resolveGameId } from "@/lib/utils";
import { getLotteryPhotosForGame } from "@/lib/utils/lottery";
import { getOptionsLotteriesForGame, getResultForTable } from "@/lib/utils/options-lottery";
import { inset, space } from "@/lib/theme/spacing";
import { goBackTo, goTo } from "@/lib/utils/navigation";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { DrawerActions } from "expo-router/react-navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";

type ActionButton = {
  key: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  labelKey: string;
  onPress: (gameId: string, origin: string) => void;
  requiresActiveGame?: boolean;
  featureFlag?: (typeof FeatureFlagSlugs)[keyof typeof FeatureFlagSlugs];
};

const ACTION_BUTTONS: ActionButton[] = [
  {
    key: "lottery",
    icon: "shuffle",
    labelKey: "actions.lottery",
    featureFlag: FeatureFlagSlugs.LOTTERY,
    onPress: (gameId, origin) =>
      goTo(origin, `/(pages)/(user)/lottery?gameId=${gameId}`),
  },
  {
    key: "rules",
    icon: "book-outline",
    labelKey: "actions.rules",
    onPress: (gameId, origin) => goTo(origin, `/rules?gameId=${gameId}`),
  },
  {
    key: "timer",
    icon: "timer-outline",
    labelKey: "actions.timer",
    requiresActiveGame: true,
    featureFlag: FeatureFlagSlugs.TIMER,
    onPress: (gameId, origin) =>
      goTo(origin, `/(pages)/(user)/timer?gameId=${gameId}`),
  },
  {
    key: "results",
    icon: "trophy-outline",
    labelKey: "actions.results",
    requiresActiveGame: true,
    featureFlag: FeatureFlagSlugs.RESULTS,
    onPress: (gameId, origin) =>
      goTo(origin, `/(pages)/(user)/results?gameId=${gameId}`),
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
  const { user, loading } = useRequireAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["game"]);
  const navigation = useNavigation();
  const tableBellStore = useTableBellStore();
  const bellActions = useTableBellActions();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const isFeatureEnabled = useFeatureFlags();
  const tableNumber = usePlayerTable(gameId);
  const tableStore = useTableStore();
  const timerStore = useTimerStore();
  const lotteryCollection = useLotteryStore((s) => s.collection);
  const optionsLotteryCollection = useOptionsLotteryStore((s) => s.collection);
  const gameSchedule = useGameScheduleInfo(gameId);

  const optionsLotteryCount = useMemo(() => {
    if (tableNumber === null) {
      return 0;
    }
    return getOptionsLotteriesForGame(optionsLotteryCollection, gameId).filter(
      (instance) => getResultForTable(instance, tableNumber) !== null,
    ).length;
  }, [optionsLotteryCollection, gameId, tableNumber]);

  const lotteryCount = useMemo(
    () => getLotteryPhotosForGame(lotteryCollection, gameId).length + optionsLotteryCount,
    [lotteryCollection, gameId, optionsLotteryCount],
  );

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

  const isActiveGame = gameSchedule.isActive;

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

  const openMenu = useCallback(
    () => navigation.dispatch(DrawerActions.openDrawer()),
    [navigation],
  );

  const handleBack = () => {
    goBackTo(from ?? "/(pages)/(user)/schedule");
  };

  const playerColorsKey = `playerColors_${gameId}_${tableNumber}`;

  const selfHref = `/(pages)/(user)/game?gameId=${gameId}`;

  const handleTimerPress = async () => {
    const stored = await getItemAsync(playerColorsKey);
    if (!stored && currentTable) {
      setColorSetupVisible(true);
    } else {
      goTo(selfHref, `/(pages)/(user)/timer?gameId=${gameId}`);
    }
  };

  const handleSaveSetup = async (
    playerIds: (string | null)[],
    hexColors: string[],
  ) => {
    await setItemAsync(playerColorsKey, JSON.stringify(hexColors));

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
        playerPositions: validIds as any,
      });
    }

    setColorSetupVisible(false);
    goTo(selfHref, `/(pages)/(user)/timer?gameId=${gameId}`);
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

  const actions: GameAction[] = ACTION_BUTTONS.map(
    ({ key, icon, labelKey, onPress, requiresActiveGame, featureFlag }) => ({
      key,
      icon,
      label: t(labelKey),
      badgeCount: key === "lottery" ? lotteryCount : undefined,
      disabled:
        (tableNumber === null && key !== "rules" && key !== "lottery") ||
        (requiresActiveGame === true && !isActiveGame) ||
        (featureFlag !== undefined && !isFeatureEnabled(featureFlag)),
      onPress:
        key === "timer" ? handleTimerPress : () => onPress(gameId, selfHref),
    }),
  );

  const badge = gameSchedule.isFinished
    ? { label: t("state.finished"), tone: "success" as const }
    : isActiveGame
      ? { label: t("state.live"), tone: "info" as const }
      : { label: t("state.planned"), tone: "neutral" as const };

  const bellState: TableBellState =
    tableNumber === null || !isActiveGame
      ? "unavailable"
      : bell?.acknowledgeTime
        ? "acknowledged"
        : bell
          ? "ringing"
          : "idle";

  const bellHint =
    tableNumber === null
      ? t("bell.noTable")
      : bellState === "unavailable"
        ? gameSchedule.isFinished
          ? t("bell.finished")
          : t("bell.notActive")
        : bellState === "acknowledged"
          ? t("bell.acknowledged", { elapsed: formatElapsed(elapsedSeconds) })
          : bellState === "ringing"
            ? t("bell.ringing", { elapsed: formatElapsed(elapsedSeconds) })
            : t("bell.idle");

  return (
    <View style={styles.container}>
      <GameHeader
        title={gameSchedule.title}
        round={gameSchedule.round}
        tableNumber={tableNumber}
        onMenuPress={openMenu}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <BackButton onPress={handleBack} />
          <Badge label={badge.label} tone={badge.tone} />
        </View>

        {tableNumber !== null ? (
          <GameSeatingList table={currentTable} />
        ) : (
          <PlayerSelectionCard from="game" forceAllow gameId={gameId} />
        )}

        <GameActionRow actions={actions} />
      </ScrollView>

      <TableBellBar
        state={bellState}
        hint={bellHint}
        disabled={
          tableNumber === null ||
          (!isFeatureEnabled(FeatureFlagSlugs.TABLE_BELL) &&
            (!isActiveGame ||
              bellActions.isLoading ||
              (!!bell && !bellActions.canDelete(bell))))
        }
        isLoading={bellActions.isLoading}
        locked={!!bell && !bellActions.canDelete(bell)}
        onPress={toggleBell}
      />

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
    },
    content: {
      padding: inset.card,
      paddingBottom: inset.group,
      gap: space[5],
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: space[3],
    },
  });
}
