import { useScreenOrientation } from "@/lib/bootstrap/ScreenOrientationProvider";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { TimerCell } from "@/lib/components/timer/TimerCell";
import { TimerControlPanel } from "@/lib/components/timer/TimerControlPanel";
import { TimerMenu } from "@/lib/components/timer/TimerMenu";
import { usePlayerTable } from "@/lib/hooks/usePlayerTable";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useTableBellActions } from "@/lib/hooks/useTableBellActions";
import { useTimerLocalSettings } from "@/lib/hooks/useTimerLocalSettings";
import { useTimerState } from "@/lib/hooks/useTimerState";
import { useTableBellStore } from "@/lib/stores/appwrite/table-bell-store";
import { formatElapsedSeconds } from "@/lib/utils";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { OrientationLock } from "expo-screen-orientation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

export default function TimerPage() {
  useRequireAuth();
  const { forceOrientation, unlockOrientation } = useScreenOrientation();
  const params = useLocalSearchParams<{ gameId?: string }>();

  const tableNumber = usePlayerTable(params.gameId);

  useFocusEffect(
    useCallback(() => {
      forceOrientation(OrientationLock.LANDSCAPE_RIGHT);
      activateKeepAwakeAsync();
      return () => {
        unlockOrientation().catch(console.error);
        deactivateKeepAwake();
      };
    }, [forceOrientation, unlockOrientation]),
  );

  return (
    <TimerScreenContent
      key={`${params.gameId ?? "none"}-${tableNumber ?? "loading"}`}
      gameId={params.gameId}
      tableNumber={tableNumber}
    />
  );
}

function TimerScreenContent({
  gameId,
  tableNumber,
}: {
  gameId: string | undefined;
  tableNumber: number | null;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation(["timer"]);

  const tableBellStore = useTableBellStore();
  const bell = useMemo(
    () => tableBellStore.collection.find((x) => x.table === tableNumber),
    [tableBellStore.collection, tableNumber],
  );

  const { orientationMode, pauseMode, toggleOrientationMode, togglePauseMode } =
    useTimerLocalSettings(gameId);

  const {
    times,
    roundTimesLeft,
    roundExpired,
    playersInOvertime,
    playersPaused,
    allPaused,
    tableElapsedSeconds,
    depleteAnims,
    graceAnims,
    totalSeconds,
    effectiveDuration,
    roundSecondsTotal,
    direction,
    playerColors,
    cellSize,
    handleCellLayout,
    handlePress,
    handlePause,
    handleReset,
    handleSaveCustomTimer,
    handleUseDefaultTimer,
    toggleAllPause,
    existingTimer,
  } = useTimerState({ gameId, tableNumber, bell, pauseMode });

  const playerNames = useMemo(
    () => existingTimer?.playerPositions?.map((p) => p.name) ?? [],
    [existingTimer],
  );

  const bellActions = useTableBellActions();
  const [menuOpen, setMenuOpen] = useState(false);
  const [customTimerOpen, setCustomTimerOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

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

  const handleToggleBell = async () => {
    const done = bell
      ? await bellActions.dismiss(bell, {
          title: t("confirmDismiss.title"),
          message: t("confirmDismiss.message"),
          confirmLabel: t("confirmDismiss.confirm"),
          cancelLabel: t("confirmDismiss.cancel"),
          destructive: true,
        })
      : tableNumber !== null
        ? await bellActions.ring(tableNumber, undefined, {
            title: t("confirmRing.title"),
            message: t("confirmRing.message"),
            confirmLabel: t("confirmRing.confirm"),
            cancelLabel: t("confirmRing.cancel"),
          })
        : false;
    if (done) {
      setMenuOpen(false);
    }
  };

  const seatOrder: number[][] = [
    [0, 1],
    [3, 2],
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar hidden />

      <View style={styles.fill}>
        {seatOrder.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map((idx) => (
              <TimerCell
                key={idx}
                idx={idx}
                playerName={playerNames[idx]}
                timeLeft={times[idx]}
                totalSeconds={totalSeconds}
                direction={direction}
                isPaused={playersPaused[idx]}
                playersInOvertime={playersInOvertime}
                roundSecondsTotal={roundSecondsTotal}
                roundTimeLeft={roundTimesLeft[idx]}
                roundExpired={roundExpired[idx]}
                orientationMode={orientationMode}
                playerColor={playerColors[idx]}
                depleteAnim={depleteAnims.current[idx]}
                graceAnim={graceAnims.current[idx]}
                cellSize={cellSize}
                onPress={() => handlePress(idx)}
                onLayout={idx === 0 ? handleCellLayout : undefined}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.centerOverlay} pointerEvents="box-none">
        <TimerControlPanel
          onOpenMenu={() => setMenuOpen(true)}
          orientationMode={orientationMode}
          onToggleOrientation={toggleOrientationMode}
          pauseMode={pauseMode}
          onTogglePauseMode={togglePauseMode}
          bell={bell}
          bellElapsedLabel={bell ? formatElapsedSeconds(elapsedSeconds) : undefined}
          onToggleBell={handleToggleBell}
          bellLoading={bellActions.isLoading}
          bellDisabled={bellActions.isLoading || (!!bell && !bellActions.canDelete(bell))}
          allPaused={allPaused}
          onToggleAllPause={toggleAllPause}
          tableElapsedLabel={formatElapsedSeconds(tableElapsedSeconds)}
        />
      </View>

      <TimerMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onReset={async () => {
          const ok = await handleReset();
          if (ok) {
            setMenuOpen(false);
          }
        }}
        onOpenCustomTimer={() => {
          setMenuOpen(false);
          setCustomTimerOpen(true);
        }}
        onUseDefaultTimer={async () => {
          const ok = await handleUseDefaultTimer();
          if (ok) {
            setMenuOpen(false);
          }
        }}
        onCloseTimer={() => {
          setMenuOpen(false);
          handlePause();
          router.replace(
            gameId
              ? `/(pages)/(user)/game?gameId=${gameId}`
              : "/(pages)/(user)/schedule",
          );
        }}
        customTimerOpen={customTimerOpen}
        onCloseCustomTimer={() => setCustomTimerOpen(false)}
        initialDuration={effectiveDuration}
        initialDirection={direction}
        initialRoundSeconds={roundSecondsTotal}
        onSaveCustomTimer={handleSaveCustomTimer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  row: { flex: 1, flexDirection: "row" },
  centerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
});
