import { useScreenOrientation } from "@/lib/bootstrap/ScreenOrientationProvider";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { useGameStore } from "@/lib/stores/appwrite/game-store";
import { useTableBellStore } from "@/lib/stores/appwrite/table-bell-store";
import { useTimerStore } from "@/lib/stores/appwrite/timer-store";
import { type } from "@/lib/theme/typography";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { OrientationLock } from "expo-screen-orientation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
const TABLE = 1; // TODO: pass via route params when table selection is implemented

// Classic board game meeple colors — active (bright) and muted (visible but calm) per player
const PLAYER_COLORS = [
  { active: "#ff4136", muted: "#a82a23" }, // red
  { active: "#2196f3", muted: "#1565a8" }, // blue
  { active: "#00e676", muted: "#00894a" }, // green
  { active: "#ffd600", muted: "#b8960a" }, // yellow
] as const;

function formatTime(s: number) {
  const clamped = Math.max(0, s);
  const m = Math.floor(clamped / 60).toString().padStart(2, "0");
  const sec = (clamped % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function TimerPage() {
  const { colors } = useTheme();

  const { width, height } = useWindowDimensions();
  const { forceOrientation, unlockOrientation } = useScreenOrientation();
  const params = useLocalSearchParams<{ gameId?: string }>();
  const tableBellStore = useTableBellStore();
  const gameStore = useGameStore();
  const timerStore = useTimerStore();
  const initTableBells = useTableBellStore((s) => s.init);
  const initGame = useGameStore((s) => s.init);

  useFocusEffect(
    useCallback(() => {
      forceOrientation(OrientationLock.LANDSCAPE_RIGHT);
      activateKeepAwakeAsync();
      initTableBells();
      initGame();
      return () => {
        unlockOrientation().catch(console.error);
        deactivateKeepAwake();
      };
    }, [forceOrientation, unlockOrientation, initTableBells, initGame])
  );

  const game = useMemo(
    () => gameStore.collection.find((g) => g.$id === params.gameId),
    [gameStore.collection, params.gameId]
  );
  const playerCount = 4;
  const totalSeconds = game ? (game.durationMinutesTotal * 60) / playerCount : DEFAULT_SECONDS;
  const direction = game?.direction ?? "down";

  const [times, setTimes] = useState<number[]>(() =>
    Array(playerCount).fill(totalSeconds)
  );
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const timerStartedRef = useRef(false);
  if (activeIdx !== null) timerStartedRef.current = true;

  const timerDocIdRef = useRef<string | null>(null);

  const saveTimerTimes = useCallback(async (currentTimes: number[]) => {
    if (!timerDocIdRef.current) return;
    const ok = await timerStore.update({
      $id: timerDocIdRef.current,
      playerTimes: currentTimes,
      games: params.gameId ?? null,
      table: TABLE,
    }, true);
    if (!ok) {
      // Row was deleted externally — create a fresh one
      timerDocIdRef.current = null;
      const doc = await timerStore.add({
        table: TABLE,
        playerTimes: currentTimes,
        games: params.gameId ?? null,
      });
      if (doc) timerDocIdRef.current = doc.$id;
    }
  }, [timerStore, params.gameId]);

  // Sync times when game data loads/updates, but not once the timer has been started
  useEffect(() => {
    if (timerStartedRef.current) return;
    setTimes(Array(playerCount).fill(totalSeconds));
    depleteAnims.current.forEach((anim) => anim.setValue(0));
  }, [totalSeconds, playerCount]);
  const [paused, setPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellLoading, setBellLoading] = useState(false);

  const bell = useMemo(
    () => tableBellStore.collection.find((x) => x.table === TABLE),
    [tableBellStore.collection]
  );

  // One Animated.Value per player: 0 = full time remaining, 1 = depleted
  const depleteAnims = useRef(
    Array.from({ length: playerCount }, () => new Animated.Value(0))
  );

  const activeIdxRef = useRef(activeIdx);
  activeIdxRef.current = activeIdx;

  // Pause when menu is open
  const effectivelyPaused = paused || menuOpen;

  useEffect(() => {
    if (activeIdx === null || effectivelyPaused) return;

    const interval = setInterval(() => {
      setTimes((prev) => {
        const idx = activeIdxRef.current;
        if (idx === null || prev[idx] <= 0) return prev;
        const next = [...prev];
        next[idx] -= 1;

        Animated.timing(depleteAnims.current[idx], {
          toValue: 1 - next[idx] / totalSeconds,
          duration: 950,
          useNativeDriver: false,
        }).start();

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeIdx, effectivelyPaused, totalSeconds]);

  // Measured actual cell size for overlay interpolation
  const [cellSize, setCellSize] = useState({ w: width / 2, h: height / 2 });
  const handleCellLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setCellSize({ w, h });
  };

  const rotations = ["180deg", "180deg", "0deg", "0deg"] as const;

  const handlePress = (idx: number) => {
    if (times[idx] <= 0) return;
    if (activeIdx === idx) {
      if (!paused) {
        // Pausing: save current times and snap depletion animation
        saveTimerTimes(times);
        depleteAnims.current[idx].stopAnimation();
        depleteAnims.current[idx].setValue(1 - times[idx] / totalSeconds);
      }
      setPaused((p) => !p);
    } else {
      if (!timerStartedRef.current) {
        // First/re-start: reuse existing row or create a new one
        if (timerDocIdRef.current) {
          saveTimerTimes(times);
        } else {
          timerStore.add({
            table: TABLE,
            playerTimes: times,
            games: params.gameId ?? null,
          }).then((doc) => {
            if (doc) timerDocIdRef.current = doc.$id;
          });
        }
      } else if (activeIdx !== null) {
        // Player switch: save previous player's time
        saveTimerTimes(times);
      }
      setActiveIdx(idx);
      setPaused(false);
    }
  };

  const handleOpenMenu = () => {
    // Menu open acts as a pause: save times
    if (activeIdx !== null && !paused) saveTimerTimes(times);
    setMenuOpen(true);
  };

  const handleCloseMenu = () => {
    setMenuOpen(false);
  };

  const handleReset = () => {
    timerStartedRef.current = false;
    setTimes(Array(playerCount).fill(totalSeconds));
    setActiveIdx(null);
    setPaused(false);
    depleteAnims.current.forEach((anim) => {
      anim.setValue(0);
    });
    setMenuOpen(false);
  };

  const handleRingBell = async () => {
    if (bell) return; // already ringing
    try {
      setBellLoading(true);
      await tableBellStore.add({ table: TABLE, startTime: new Date().toISOString() });
    } finally {
      setBellLoading(false);
      setMenuOpen(false);
    }
  };

  const renderCell = (idx: number) => {
    const timeLeft = times[idx];
    const isRunning = activeIdx === idx && !effectivelyPaused;
    const isPausedHere = activeIdx === idx && paused && !menuOpen;
    const isDepleted = timeLeft <= 0;
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
            { ...overlayStyle, backgroundColor: colors.background },
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
              PAUSED
            </Text>
          )}
          {isDepleted && (
            <Text style={[type.eyebrow, { color: colors.error, marginTop: 4 }]}>
              TIME OUT
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

      {/* Center menu trigger */}
      <View style={styles.centerOverlay} pointerEvents="box-none">
        <Pressable
          style={[
            styles.menuTrigger,
            { backgroundColor: colors.surfaceHigh + "ee", borderColor: colors.border },
          ]}
          onPress={handleOpenMenu}
        >
          <Ionicons name="ellipsis-horizontal" size={16} color={colors.textSecondary} />
        </Pressable>
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
              PAUSED
            </Text>

            <MenuButton
              icon="notifications-outline"
              label={bell ? "Bell ringing…" : "Ring table bell"}
              color={bell ? colors.textMuted : colors.text}
              onPress={handleRingBell}
              disabled={!!bell || bellLoading}
              loading={bellLoading}
              colors={colors}
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <MenuButton
              icon="refresh-outline"
              label="Reset timers"
              color={colors.text}
              onPress={handleReset}
              colors={colors}
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <MenuButton
              icon="close-outline"
              label="Close timer"
              color={colors.error}
              onPress={() => { setMenuOpen(false); router.replace(params.gameId ? `/(pages)/(user)/game?gameId=${params.gameId}` : "/(pages)/(user)/schedule"); }}
              colors={colors}
            />
          </View>
        </Pressable>
      )}
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
    backgroundColor: "#00000088",
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
});
