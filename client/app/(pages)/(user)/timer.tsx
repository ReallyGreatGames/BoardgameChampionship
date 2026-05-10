import { useScreenOrientation } from "@/lib/bootstrap/ScreenOrientationProvider";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { TimerCell } from "@/lib/components/TimerCell";
import { TimerMenu } from "@/lib/components/TimerMenu";
import { usePlayerTable } from "@/lib/hooks/usePlayerTable";
import { useTableBellActions } from "@/lib/hooks/useTableBellActions";
import { useTimerState } from "@/lib/hooks/useTimerState";
import { useTableBellStore } from "@/lib/stores/appwrite/table-bell-store";
import { formatElapsedSeconds } from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { OrientationLock } from "expo-screen-orientation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StatusBar, StyleSheet, Text, View } from "react-native";

export default function TimerPage() {
  const { colors } = useTheme();
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

  const tableBellStore = useTableBellStore();
  const bell = useMemo(
    () => tableBellStore.collection.find((x) => x.table === tableNumber),
    [tableBellStore.collection, tableNumber],
  );

  const {
    times,
    activeIdx,
    paused,
    playersInOvertime,
    depleteAnims,
    totalSeconds,
    direction,
    playerColors,
    cellSize,
    handleCellLayout,
    handlePress,
    handleReset,
    handleSaveCustomTimer,
    existingTimer,
    timerSettings,
  } = useTimerState({ gameId: params.gameId, tableNumber, bell });

  const playerNames = useMemo(
    () => existingTimer?.playerPositions?.map((p) => p.name) ?? [],
    [existingTimer],
  );

  const bellActions = useTableBellActions();
  const [menuOpen, setMenuOpen] = useState(false);
  const [customTimerOpen, setCustomTimerOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const bellColor = bell?.acknowledgeTime ? colors.success : colors.accent;

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
          title: "confirmDismiss.title",
          message: "confirmDismiss.message",
          confirmLabel: "confirmDismiss.confirm",
          cancelLabel: "confirmDismiss.cancel",
          destructive: true,
        })
      : tableNumber !== null
        ? await bellActions.ring(tableNumber, undefined, {
            title: "confirmRing.title",
            message: "confirmRing.message",
            confirmLabel: "confirmRing.confirm",
            cancelLabel: "confirmRing.cancel",
          })
        : false;
    if (done) {
      setMenuOpen(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar hidden />

      <View style={styles.fill}>
        <View style={styles.row}>
          {([0, 1] as const).map((idx) => (
            <TimerCell
              key={idx}
              idx={idx}
              playerName={playerNames[idx]}
              timeLeft={times[idx]}
              totalSeconds={totalSeconds}
              direction={direction}
              activeIdx={activeIdx}
              paused={paused}
              playersInOvertime={playersInOvertime}
              playerColor={playerColors[idx]}
              depleteAnim={depleteAnims.current[idx]}
              cellSize={cellSize}
              onPress={() => handlePress(idx)}
              onLayout={idx === 0 ? handleCellLayout : undefined}
            />
          ))}
        </View>
        <View style={styles.row}>
          {([3, 2] as const).map((idx) => (
            <TimerCell
              key={idx}
              idx={idx}
              playerName={playerNames[idx]}
              timeLeft={times[idx]}
              totalSeconds={totalSeconds}
              direction={direction}
              activeIdx={activeIdx}
              paused={paused}
              playersInOvertime={playersInOvertime}
              playerColor={playerColors[idx]}
              depleteAnim={depleteAnims.current[idx]}
              cellSize={cellSize}
              onPress={() => handlePress(idx)}
            />
          ))}
        </View>
      </View>

      <View style={styles.centerOverlay} pointerEvents="box-none">
        <Pressable
          style={[
            styles.menuTrigger,
            {
              backgroundColor: colors.surfaceHigh + "ee",
              borderColor: colors.border,
            },
            bell && !bell.acknowledgeTime && { borderColor: colors.accent },
            bell?.acknowledgeTime && { borderColor: colors.success },
          ]}
          onPress={() => setMenuOpen(true)}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={20}
            color={colors.textSecondary}
          />
        </Pressable>

        {bell && (
          <View
            style={[
              styles.bellBadge,
              {
                backgroundColor: colors.surface,
                borderColor: bell.acknowledgeTime
                  ? colors.success
                  : colors.accent,
              },
            ]}
          >
            <View style={styles.bellBadgeIcons}>
              {bell.acknowledgeTime && (
                <Ionicons name="walk-outline" size={10} color={bellColor} />
              )}
              <Ionicons
                name={
                  bell.acknowledgeTime
                    ? "notifications-off-outline"
                    : "notifications-outline"
                }
                size={12}
                color={bellColor}
              />
            </View>
            <Text style={[styles.bellBadgeTime, { color: bellColor }]}>
              {formatElapsedSeconds(elapsedSeconds)}
            </Text>
          </View>
        )}
      </View>

      <TimerMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        bell={bell}
        bellActions={bellActions}
        onToggleBell={handleToggleBell}
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
        onCloseTimer={() => {
          setMenuOpen(false);
          router.replace(
            params.gameId
              ? `/(pages)/(user)/game?gameId=${params.gameId}`
              : "/(pages)/(user)/schedule",
          );
        }}
        customTimerOpen={customTimerOpen}
        onCloseCustomTimer={() => setCustomTimerOpen(false)}
        initialDuration={
          existingTimer?.durationMinutesTotal ??
          timerSettings?.durationMinutesTotal
        }
        initialDirection={existingTimer?.direction ?? timerSettings?.direction}
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
  menuTrigger: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bellBadge: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  bellBadgeIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  bellBadgeTime: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
