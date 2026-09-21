import { useScreenOrientation } from "@/lib/bootstrap/ScreenOrientationProvider";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { PlayerColorSetupModal } from "@/lib/components/onboarding/PlayerColorSetupModal";
import { TimerCell } from "@/lib/components/timer/TimerCell";
import { TimerControlPanel } from "@/lib/components/timer/TimerControlPanel";
import { TimerMenu } from "@/lib/components/timer/TimerMenu";
import { usePlayerTable } from "@/lib/hooks/usePlayerTable";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useRoundCountdown } from "@/lib/hooks/useRoundCountdown";
import { useTableBellActions } from "@/lib/hooks/useTableBellActions";
import { useTimerLocalSettings } from "@/lib/hooks/useTimerLocalSettings";
import { useTimerState } from "@/lib/hooks/useTimerState";
import { useScheduleStore } from "@/lib/stores/appwrite/schedule-store";
import { useTableBellStore } from "@/lib/stores/appwrite/table-bell-store";
import { formatElapsedSeconds } from "@/lib/utils";
import { goBackTo } from "@/lib/utils/navigation";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { OrientationLock } from "expo-screen-orientation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

export default function TimerPage() {
  useRequireAuth();
  const { forceOrientation, unlockOrientation } = useScreenOrientation();
  const params = useLocalSearchParams<{ gameId?: string; from?: string }>();

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
      from={params.from}
      tableNumber={tableNumber}
    />
  );
}

function TimerScreenContent({
  gameId,
  from,
  tableNumber,
}: {
  gameId: string | undefined;
  from: string | undefined;
  tableNumber: number | null;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation(["timer"]);

  const tableBellStore = useTableBellStore();
  const bell = useMemo(
    () => tableBellStore.collection.find((x) => x.table === tableNumber),
    [tableBellStore.collection, tableNumber],
  );

  const scheduleCollection = useScheduleStore((s) => s.collection);
  const scheduleItem = useMemo(
    () => scheduleCollection.find((item) => item.gameId === gameId),
    [scheduleCollection, gameId],
  );
  const roundCountdown = useRoundCountdown(scheduleItem);

  const { orientationMode, pauseMode, toggleOrientationMode, togglePauseMode } =
    useTimerLocalSettings(gameId);

  const {
    times,
    roundTimesLeft,
    roundExpired,
    playersInOvertime,
    playersPaused,
    allPaused,
    depleteAnims,
    graceAnims,
    totalSeconds,
    effectiveDuration,
    roundSecondsTotal,
    direction,
    playerColors,
    savedPlayerColors,
    setPlayerColors,
    cellSize,
    handleCellLayout,
    handlePress,
    handlePause,
    handleReset,
    handleSaveCustomTimer,
    handleUseDefaultTimer,
    toggleAllPause,
    existingTimer,
    timerSettings,
    spamProtectionActive,
  } = useTimerState({ gameId, tableNumber, bell, pauseMode });

  const players = useMemo(
    () => existingTimer?.playerPositions ?? [],
    [existingTimer?.playerPositions],
  );
  const playerNames = useMemo(() => players.map((p) => p.name), [players]);

  const bellActions = useTableBellActions();
  const [menuStage, setMenuStage] = useState<"options" | "settings" | null>(null);
  const [customTimerOpen, setCustomTimerOpen] = useState(false);
  const [playerColorsOpen, setPlayerColorsOpen] = useState(false);
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
      setMenuStage(null);
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
          onOpenMenu={() => setMenuStage("options")}
          allPaused={allPaused}
          onToggleAllPause={toggleAllPause}
          roundCountdown={roundCountdown}
          spamProtectionActive={spamProtectionActive}
        />
      </View>

      <TimerMenu
        stage={menuStage}
        onClose={() => setMenuStage(null)}
        onOpenSettings={() => setMenuStage("settings")}
        onBackToOptions={() => setMenuStage("options")}
        orientationMode={orientationMode}
        onToggleOrientation={toggleOrientationMode}
        pauseMode={pauseMode}
        onTogglePauseMode={togglePauseMode}
        bell={bell}
        bellElapsedLabel={bell ? formatElapsedSeconds(elapsedSeconds) : undefined}
        onToggleBell={handleToggleBell}
        bellLoading={bellActions.isLoading}
        bellDisabled={bellActions.isLoading || (!!bell && !bellActions.canDelete(bell))}
        onReset={async () => {
          const ok = await handleReset();
          if (ok) {
            setMenuStage(null);
          }
        }}
        onOpenCustomTimer={() => {
          setMenuStage(null);
          setCustomTimerOpen(true);
        }}
        onOpenPlayerColors={() => {
          setMenuStage(null);
          setPlayerColorsOpen(true);
        }}
        onUseDefaultTimer={async () => {
          const ok = await handleUseDefaultTimer();
          if (ok) {
            setMenuStage(null);
          }
        }}
        onCloseTimer={() => {
          setMenuStage(null);
          handlePause();
          goBackTo(
            from ??
              (gameId
                ? `/(pages)/(user)/game?gameId=${gameId}`
                : "/(pages)/(user)/schedule"),
          );
        }}
        customTimerOpen={customTimerOpen}
        onCloseCustomTimer={() => setCustomTimerOpen(false)}
        initialDuration={effectiveDuration}
        initialDirection={direction}
        initialRoundSeconds={roundSecondsTotal}
        onSaveCustomTimer={handleSaveCustomTimer}
      />

      <PlayerColorSetupModal
        visible={playerColorsOpen}
        onClose={() => setPlayerColorsOpen(false)}
        players={players}
        customColors={timerSettings?.colors}
        initialColors={savedPlayerColors ?? undefined}
        allowPlayerReassignment={false}
        title={t("reassignColors")}
        saveLabel={t("saveColors")}
        onSave={async (_playerIds, hexColors) => {
          setPlayerColors(hexColors);
          setPlayerColorsOpen(false);
        }}
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
