import { useScreenOrientation } from "@/lib/bootstrap/ScreenOrientationProvider";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { CustomTimerModal } from "@/lib/components/CustomTimerModal";
import { useDialog } from "@/lib/components/Dialog";
import { useTableBellActions } from "@/lib/hooks/useTableBellActions";
import { useTableBellStore } from "@/lib/stores/appwrite/table-bell-store";
import { useTimerSettingsStore } from "@/lib/stores/appwrite/timer-settings-store";
import { useTimerStore } from "@/lib/stores/appwrite/timer-store";
import { type } from "@/lib/theme/typography";
import { ui } from "@/lib/theme/ui";
import { formatElapsedSeconds, formatTime } from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { OrientationLock } from "expo-screen-orientation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  LayoutChangeEvent,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

const DEFAULT_SECONDS = 10 * 60;
const OVERTIME_SECONDS = 30;
const TABLE = 1; // TODO: pass via route params when table selection is implemented

function resolveGameId(ref: unknown): string | null {
  if (!ref) return null;
  if (typeof ref === "string") return ref;
  if (Array.isArray(ref)) {
    const first = ref[0];
    if (!first) return null;
    return typeof first === "string" ? first : (first as any).$id ?? null;
  }
  return (ref as any).$id ?? null;
}

function toNumberArray(value: unknown): number[] {
  if (Array.isArray(value)) return value as number[];
  if (typeof value === "string") {
    try { return JSON.parse(value) as number[]; } catch { return []; }
  }
  return [];
}

function toBooleanArray(value: unknown): boolean[] {
  if (Array.isArray(value)) return value as boolean[];
  if (typeof value === "string") {
    try { return JSON.parse(value) as boolean[]; } catch { return []; }
  }
  return [];
}

// Classic board game meeple colors — active (bright), muted (paused/idle), elapsed (consumed time) per player
const PLAYER_COLORS = [
  { active: "#ff4136", muted: "#a82a23", elapsed: "#5c1510", elapsedMuted: "#2e0a08" }, // red
  { active: "#2196f3", muted: "#1565a8", elapsed: "#0a2f60", elapsedMuted: "#051830" }, // blue
  { active: "#00e676", muted: "#00894a", elapsed: "#0a3d20", elapsedMuted: "#051e10" }, // green
  { active: "#ffd600", muted: "#b8960a", elapsed: "#604800", elapsedMuted: "#302400" }, // yellow
] as const;

export default function TimerPage() {
  const { colors } = useTheme();
  const { t } = useTranslation(["timer"]);

  const { width, height } = useWindowDimensions();
  const { forceOrientation, unlockOrientation } = useScreenOrientation();
  const params = useLocalSearchParams<{ gameId?: string }>();
  const tableBellStore = useTableBellStore();
  const timerSettingsStore = useTimerSettingsStore();
  const timerStore = useTimerStore();
  const { confirm } = useDialog();

  useFocusEffect(
    useCallback(() => {
      forceOrientation(OrientationLock.LANDSCAPE_RIGHT);
      activateKeepAwakeAsync();
      return () => {
        unlockOrientation().catch(console.error);
        deactivateKeepAwake();
      };
    }, [forceOrientation, unlockOrientation])
  );

  const timerSettings = useMemo(
    () => timerSettingsStore.collection.find((g) => g.$id === params.gameId),
    [timerSettingsStore.collection, params.gameId]
  );

  // Find the canonical timer document for this table+game in the real-time collection
  const existingTimer = useMemo(
    () => timerStore.collection.find(
      (t) => t.table === TABLE && resolveGameId(t.games) === (params.gameId ?? null)
    ),
    [timerStore.collection, params.gameId]
  );

  const playerCount = 4;
  const effectiveDuration = existingTimer?.durationMinutesTotal ?? timerSettings?.durationMinutesTotal;
  const totalSeconds = effectiveDuration ? (effectiveDuration * 60) / playerCount : DEFAULT_SECONDS;
  const direction = existingTimer?.direction ?? timerSettings?.direction ?? "down";

  const [times, setTimes] = useState<number[]>(() =>
    Array(playerCount).fill(totalSeconds)
  );
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [playersInOvertime, setPlayersInOvertime] = useState<boolean[]>(() =>
    Array(playerCount).fill(false)
  );

  const timerStartedRef = useRef(false);
  if (activeIdx !== null) timerStartedRef.current = true;

  const timerDocIdRef = useRef<string | null>(null);

  // On every real-time update: adopt doc ID, sync active player, paused state and times
  useEffect(() => {
    if (!existingTimer) return;
    timerDocIdRef.current = existingTimer.$id;

    setActiveIdx(existingTimer.activePlayerTimer ?? null);
    setPaused(existingTimer.paused ?? false);

    const remoteTimes = toNumberArray(existingTimer.playerTimes);
    if (remoteTimes.length !== playerCount) return;
    setTimes(remoteTimes);

    const remoteOvertime = toBooleanArray((existingTimer as any).playersInOvertime);
    if (remoteOvertime.length === playerCount) setPlayersInOvertime(remoteOvertime);

    remoteTimes.forEach((remoteTime, i) => {
      const base = remoteOvertime[i] ? OVERTIME_SECONDS : totalSeconds;
      depleteAnims.current[i].setValue(1 - Math.min(remoteTime, base) / base);
    });
  }, [existingTimer, playerCount, totalSeconds]);

  // Single update call for all mutable timer state
  const saveState = useCallback(async (
    currentTimes: number[],
    activePlayer: number | null,
    isPaused: boolean,
    playersInOvertime: boolean[]
  ) => {
    const id = timerDocIdRef.current;
    if (!id) return;
    const ok = await timerStore.update({
      $id: id,
      playerTimes: currentTimes,
      activePlayerTimer: activePlayer as any,
      paused: isPaused,
      playersInOvertime
    }, true);

    if (!ok) {
      timerDocIdRef.current = null;
      const inCollection = timerStore.collection.find(
        (t) => t.table === TABLE && resolveGameId(t.games) === (params.gameId ?? null)
      );

      if (inCollection) {
        timerDocIdRef.current = inCollection.$id;

        await timerStore.update({
          $id: inCollection.$id,
          playerTimes: currentTimes,
          activePlayerTimer: activePlayer as any,
          paused: isPaused,
          playersInOvertime
        }, true);
      } else {
        const doc = await timerStore.add({
          table: TABLE,
          playerTimes: currentTimes,
          games: params.gameId ?? null,
          activePlayerTimer: activePlayer,
          paused: isPaused,
          playersInOvertime
        });

        if (doc) timerDocIdRef.current = doc.$id;
      }
    }
  }, [timerStore, params.gameId]);

  // Reset to default when game settings change, unless the timer is already in use
  useEffect(() => {
    if (timerStartedRef.current) return;
    setTimes(Array(playerCount).fill(totalSeconds));
    depleteAnims.current.forEach((anim) => anim.setValue(0));
  }, [totalSeconds, playerCount]);

  const bellActions = useTableBellActions();
  const [paused, setPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [customTimerOpen, setCustomTimerOpen] = useState(false);

  const bell = useMemo(
    () => tableBellStore.collection.find((x) => x.table === TABLE),
    [tableBellStore.collection]
  );

  const bellColor = bell?.acknowledgeTime
    ? colors.success
    : colors.accent;

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

  // One Animated.Value per player: 0 = full time remaining, 1 = depleted
  const depleteAnims = useRef(
    Array.from({ length: playerCount }, () => new Animated.Value(0))
  );

  const activeIdxRef = useRef(activeIdx);
  activeIdxRef.current = activeIdx;

  const playersInOvertimeRef = useRef(playersInOvertime);
  playersInOvertimeRef.current = playersInOvertime;

  const bellFiredRef = useRef(new Set<number>());

  const effectivelyPaused = paused;

  useEffect(() => {
    if (activeIdx === null || effectivelyPaused) return;

    const interval = setInterval(() => {
      setTimes((prev) => {
        const idx = activeIdxRef.current;
        if (idx === null || prev[idx] <= 0) return prev;
        const next = [...prev];
        next[idx] -= 1;

        const base = playersInOvertimeRef.current[idx] ? OVERTIME_SECONDS : totalSeconds;
        Animated.timing(depleteAnims.current[idx], {
          toValue: 1 - next[idx] / base,
          duration: 950,
          useNativeDriver: false,
        }).start();

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeIdx, effectivelyPaused, totalSeconds]);

  useEffect(() => {
    if (activeIdx === null) return;
    if (times[activeIdx] !== 0) return;
    if (bellFiredRef.current.has(activeIdx)) return;
    bellFiredRef.current.add(activeIdx);
    if (!bell) {
      tableBellStore.add({
        table: TABLE,
        startTime: new Date().toISOString(),
        locked: true,
        reason: t("timerElapsed"),
      });
    }
  }, [times, activeIdx]);

  // Measured actual cell size for overlay interpolation
  const [cellSize, setCellSize] = useState({ w: width / 2, h: height / 2 });
  const handleCellLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setCellSize({ w, h });
  };

  const rotations = ["180deg", "180deg", "0deg", "0deg"] as const;

  const handlePress = (idx: number) => {
    if (times[idx] <= 0) {
      // Time ran out — click starts/restarts the 30s overtime
      const nextTimes = [...times];
      // Forfeit running overtime of the outgoing player
      if (activeIdx !== null && activeIdx !== idx && playersInOvertime[activeIdx] && nextTimes[activeIdx] > 0) {
        nextTimes[activeIdx] = 0;
        depleteAnims.current[activeIdx].setValue(1);
      }
      nextTimes[idx] = OVERTIME_SECONDS;
      const nextOvertime = [...playersInOvertime];
      nextOvertime[idx] = true;
      setTimes(nextTimes);
      setPlayersInOvertime(nextOvertime);
      setActiveIdx(idx);
      setPaused(false);
      depleteAnims.current[idx].setValue(0);
      saveState(nextTimes, idx, false, nextOvertime);
      return;
    }

    if (activeIdx === idx) {
      const newPaused = !paused;
      if (newPaused) {
        // Going to paused: snap depletion animation to exact position
        depleteAnims.current[idx].stopAnimation();
        const base = playersInOvertime[idx] ? OVERTIME_SECONDS : totalSeconds;
        depleteAnims.current[idx].setValue(1 - times[idx] / base);
      }
      setPaused(newPaused);
      saveState(times, idx, newPaused, playersInOvertime);
    } else {
      let nextTimes = [...times];

      // Forfeit remaining overtime of the outgoing player
      if (activeIdx !== null && playersInOvertime[activeIdx] && nextTimes[activeIdx] > 0) {
        nextTimes[activeIdx] = 0;
        depleteAnims.current[activeIdx].setValue(1);
      }

      // When switching to an overtime player, reset their clock to 30s
      if (playersInOvertime[idx]) {
        nextTimes[idx] = OVERTIME_SECONDS;
        depleteAnims.current[idx].setValue(0);
      }

      setTimes(nextTimes);

      if (!timerStartedRef.current) {
        // First/re-start: reuse existing row or create a new one
        if (timerDocIdRef.current) {
          saveState(nextTimes, idx, false, playersInOvertime);
        } else {
          // Guard: check store collection before creating to avoid duplicates
          const inCollection = timerStore.collection.find(
            (t) => t.table === TABLE && resolveGameId(t.games) === (params.gameId ?? null)
          );
          if (inCollection) {
            timerDocIdRef.current = inCollection.$id;
            saveState(nextTimes, idx, false, playersInOvertime);
          } else {
            timerStore.add({
              table: TABLE,
              playerTimes: nextTimes,
              games: params.gameId ?? null,
              activePlayerTimer: idx,
              paused: false,
              playersInOvertime,
            }).then((doc) => {
              if (doc) timerDocIdRef.current = doc.$id;
            });
          }
        }
      } else if (activeIdx !== null) {
        saveState(nextTimes, idx, false, playersInOvertime);
      }
      setActiveIdx(idx);
      setPaused(false);
    }
  };

  const handleOpenMenu = () => {
    setMenuOpen(true);
  };

  const handleCloseMenu = () => {
    setMenuOpen(false);
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: t("confirmReset.title"),
      message: t("confirmReset.message"),
      confirmLabel: t("confirmReset.confirm"),
      cancelLabel: t("confirmReset.cancel"),
      destructive: true,
    });
    if (!ok) return;

    const defaultTimes = Array(playerCount).fill(totalSeconds);
    const defaultOvertime = Array(playerCount).fill(false);
    timerStartedRef.current = false;
    setTimes(defaultTimes);
    setPlayersInOvertime(defaultOvertime);
    setActiveIdx(0);
    setPaused(true);
    depleteAnims.current.forEach((anim) => anim.setValue(0));
    saveState(defaultTimes, 0, true, defaultOvertime);
    setMenuOpen(false);
  };

  const handleSaveCustomTimer = useCallback(async (durationMinutes: number, dir: "up" | "down") => {
    const newTotalSeconds = (durationMinutes * 60) / playerCount;
    const defaultTimes = Array(playerCount).fill(newTotalSeconds);
    const defaultOvertime = Array(playerCount).fill(false);
    timerStartedRef.current = false;
    setTimes(defaultTimes);
    setPlayersInOvertime(defaultOvertime);
    setActiveIdx(0);
    setPaused(true);
    depleteAnims.current.forEach((anim) => anim.setValue(0));

    const id = timerDocIdRef.current;
    if (id) {
      await timerStore.update({
        $id: id,
        durationMinutesTotal: durationMinutes,
        direction: dir,
        playerTimes: defaultTimes,
        activePlayerTimer: 0 as any,
        playersInOvertime: [false, false, false, false],
        paused: true,
      }, true);
    } else {
      const doc = await timerStore.add({
        table: TABLE,
        games: params.gameId ?? null,
        durationMinutesTotal: durationMinutes,
        direction: dir,
        playerTimes: defaultTimes,
        activePlayerTimer: 0,
        playersInOvertime: [false, false, false, false],
        paused: true,
      });
      if (doc) timerDocIdRef.current = doc.$id;
    }
  }, [timerStore, params.gameId, playerCount]);

  const handleToggleBell = async () => {
    const done = bell
      ? await bellActions.dismiss(bell, {
        title: t("confirmDismiss.title"),
        message: t("confirmDismiss.message"),
        confirmLabel: t("confirmDismiss.confirm"),
        cancelLabel: t("confirmDismiss.cancel"),
        destructive: true,
      })
      : await bellActions.ring(TABLE, undefined, {
        title: t("confirmRing.title"),
        message: t("confirmRing.message"),
        confirmLabel: t("confirmRing.confirm"),
        cancelLabel: t("confirmRing.cancel"),
      });
    if (done) setMenuOpen(false);
  };

  const renderCell = (idx: number) => {
    const timeLeft = times[idx];
    const isRunning = activeIdx === idx && !effectivelyPaused;
    const isPausedHere = activeIdx === idx && paused;
    const isDepleted = timeLeft <= 0 || playersInOvertime[idx];
    const rotation = rotations[idx] ?? "0deg";

    // Overlay slides in from the nearest device edge toward the center
    // Grid (clockwise): [0,1] top row, [3,2] bottom row — left col = 0|3, right col = 1|2
    const isLeftCol = playerCount === 4 ? (idx === 0 || idx === 3) : null;
    const overlayAnchor = playerCount === 4
      ? (isLeftCol ? "left" : "right")
      : (idx === 0 ? "top" : "bottom");
    const overlayMax = playerCount === 4 ? cellSize.w : cellSize.h;
    const overlaySize = depleteAnims.current[idx].interpolate({
      inputRange: [0, 1],
      outputRange: [0, overlayMax],
    });
    const overlayStyle = playerCount === 4
      ? { top: 0, bottom: 0, [overlayAnchor]: 0, width: overlaySize }
      : { left: 0, right: 0, [overlayAnchor]: 0, height: overlaySize };

    const playerColor = PLAYER_COLORS[idx % PLAYER_COLORS.length];

    const bgColor = isDepleted
      ? colors.error + "30"
      : isRunning
        ? playerColor.active + "cc"
        : playerColor.muted + "55";

    const timeColor = isDepleted
      ? colors.error
      : isRunning
        ? "#ffffff"
        : playerColor.muted;

    return (
      <Pressable
        key={idx}
        style={[styles.cell, { backgroundColor: bgColor }]}
        onPress={() => handlePress(idx)}
        onLayout={idx === 0 ? handleCellLayout : undefined}
      >
        <Animated.View
          style={[
            styles.depletionOverlay,
            { ...overlayStyle, backgroundColor: isRunning ? playerColor.elapsed : playerColor.elapsedMuted },
          ]}
          pointerEvents="none"
        />

        <View style={[styles.cellContent, { transform: [{ rotate: rotation }] }]}>
          <Text style={[type.eyebrow, { color: colors.textMuted }]}>P{idx + 1}</Text>
          <Text style={[styles.timeText, { color: timeColor }]}>
            {direction === "up"
              ? formatTime(totalSeconds - timeLeft)
              : formatTime(timeLeft)}
          </Text>
          {isRunning && (
            <View style={[styles.activePip, { backgroundColor: playerColor.active }]} />
          )}
          {isPausedHere && (
            <Text style={[type.eyebrow, { color: colors.textMuted, marginTop: 4 }]}>
              {t("paused")}
            </Text>
          )}
          {isDepleted && (
            <Text style={[type.eyebrow, { color: colors.error, marginTop: 4 }]}>
              {t("timeOut")}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar hidden />

      <View style={styles.fill}>
        <View style={styles.row}>
          {renderCell(0)}
          {renderCell(1)}
        </View>
        <View style={styles.row}>
          {renderCell(3)}
          {renderCell(2)}
        </View>
      </View>

      {/* Center menu trigger + bell badge */}
      <View style={styles.centerOverlay} pointerEvents="box-none">
        <Pressable
          style={[
            styles.menuTrigger,
            { backgroundColor: colors.surfaceHigh + "ee", borderColor: colors.border },
            bell && !bell.acknowledgeTime && { borderColor: colors.accent },
            bell?.acknowledgeTime && { borderColor: colors.success },
          ]}
          onPress={handleOpenMenu}
        >
          <Ionicons name="ellipsis-horizontal" size={16} color={colors.textSecondary} />
        </Pressable>

        {bell && (
          <View style={[
            styles.bellBadge,
            {
              backgroundColor: colors.surface,
              borderColor: bell.acknowledgeTime ? colors.success : colors.accent,
            },
          ]}>
            <View style={styles.bellBadgeIcons}>
              {bell.acknowledgeTime && (
                <Ionicons name="walk-outline" size={10} color={bellColor} />
              )}
              <Ionicons
                name={bell.acknowledgeTime ? "notifications-off-outline" : "notifications-outline"}
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

      {/* Menu overlay — in-tree to avoid Modal/Drawer conflicts */}
      {menuOpen && (
        <Pressable style={styles.menuBackdrop} onPress={handleCloseMenu}>
          <View
            style={[
              styles.menuCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[type.eyebrow, { color: colors.textMuted, marginBottom: 8, paddingHorizontal: 20, paddingTop: 8 }]}>
              {t("paused")}
            </Text>

            <MenuButton
              icon={bell ? "notifications-off-outline" : "notifications-outline"}
              label={bell?.acknowledgeTime ? t("bellAcknowledged") : bell ? t("bellRinging") : t("ringBell")}
              color={bell?.acknowledgeTime ? colors.success : bell ? colors.accent : colors.text}
              onPress={handleToggleBell}
              disabled={bellActions.isLoading || (!!bell && !bellActions.canDelete(bell))}
              loading={bellActions.isLoading}
              colors={colors}
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <MenuButton
              icon="refresh-outline"
              label={t("resetTimers")}
              color={colors.text}
              onPress={handleReset}
              colors={colors}
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <MenuButton
              icon="time-outline"
              label={t("customTimer")}
              color={colors.text}
              onPress={() => { setMenuOpen(false); setCustomTimerOpen(true); }}
              colors={colors}
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <MenuButton
              icon="close-outline"
              label={t("closeTimer")}
              color={colors.error}
              onPress={() => { setMenuOpen(false); router.replace(params.gameId ? `/(pages)/(user)/game?gameId=${params.gameId}` : "/(pages)/(user)/schedule"); }}
              colors={colors}
            />
          </View>
        </Pressable>
      )}

      <CustomTimerModal
        visible={customTimerOpen}
        onClose={() => setCustomTimerOpen(false)}
        initialDuration={existingTimer?.durationMinutesTotal ?? timerSettings?.durationMinutesTotal}
        initialDirection={existingTimer?.direction ?? timerSettings?.direction}
        onSave={handleSaveCustomTimer}
      />
    </View>
  );
}

type MenuButtonProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
};

function MenuButton({ icon, label, color, onPress, disabled, loading, colors }: MenuButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuBtn,
        pressed && { backgroundColor: colors.surfaceHigh },
        disabled && { opacity: 0.4 },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Ionicons name={icon} size={22} color={color} />
      )}
      <Text style={[type.body, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  row: { flex: 1, flexDirection: "row" },
  cell: {
    flex: 1,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#122040",
  },
  depletionOverlay: {
    position: "absolute",
  },
  cellContent: {
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontFamily: "BarlowCondensed_800ExtraBold",
    fontSize: 64,
    lineHeight: 68,
    letterSpacing: -1,
  },
  activePip: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
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
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  menuBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: ui.backdropColor,
    justifyContent: "center",
    alignItems: "center",
  },
  menuCard: {
    width: 240,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 0,
    alignItems: "stretch",
  },
  menuBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
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
