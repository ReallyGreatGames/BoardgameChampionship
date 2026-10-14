import { useScreenOrientation } from "@/lib/bootstrap/ScreenOrientationProvider";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { TimerCell } from "@/lib/components/timer/TimerCell";
import { TimerControlPanel } from "@/lib/components/timer/TimerControlPanel";
import { OfflineTimerConfig, useOfflineTimer } from "@/lib/hooks/useOfflineTimer";
import { useTimerLocalSettings } from "@/lib/hooks/useTimerLocalSettings";
import { useConnectivityStore } from "@/lib/stores/connectivity-store";
import { ui } from "@/lib/theme/ui";
import { type } from "@/lib/theme/typography";
import { Ionicons } from "@expo/vector-icons";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { OrientationLock } from "expo-screen-orientation";
import { useCallback, useMemo, useState, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

const DEFAULT_MINUTES = 15;
const MINUTES_MAX = 999;
const ROUND_SECONDS_MAX = 9999;

function parseParam(
  value: string | string[] | undefined,
  fallback: number,
  max: number,
): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.min(parsed, max);
}

export default function OfflineTimerPage() {
  const { forceOrientation, unlockOrientation } = useScreenOrientation();
  const params = useLocalSearchParams<{
    duration?: string;
    round?: string;
    direction?: string;
  }>();
  const setTimerActive = useConnectivityStore((s) => s.setTimerActive);

  const config = useMemo<OfflineTimerConfig>(() => {
    const perPlayerMinutes = parseParam(
      params.duration,
      DEFAULT_MINUTES,
      MINUTES_MAX,
    );
    const roundSecondsTotal = parseParam(params.round, 0, ROUND_SECONDS_MAX);
    const direction = params.direction === "up" ? "up" : "down";
    return {
      perPlayerMinutes: Math.max(1, perPlayerMinutes),
      roundSecondsTotal,
      direction,
    };
  }, [params.duration, params.round, params.direction]);

  useFocusEffect(
    useCallback(() => {
      forceOrientation(OrientationLock.LANDSCAPE_RIGHT);
      activateKeepAwakeAsync();
      setTimerActive(true);
      return () => {
        unlockOrientation().catch(console.error);
        deactivateKeepAwake();
        setTimerActive(false);
      };
    }, [forceOrientation, unlockOrientation, setTimerActive]),
  );

  return (
    <OfflineTimerBoard
      key={`${config.perPlayerMinutes}-${config.roundSecondsTotal}-${config.direction}`}
      config={config}
    />
  );
}

function OfflineTimerBoard({ config }: { config: OfflineTimerConfig }) {
  const { colors } = useTheme();
  const { t } = useTranslation(["timer"]);
  const { orientationMode, pauseMode, toggleOrientationMode, togglePauseMode } =
    useTimerLocalSettings("offline");
  const [menuOpen, setMenuOpen] = useState(false);

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
    roundSecondsTotal,
    direction,
    playerColors,
    cellSize,
    handleCellLayout,
    handlePress,
    toggleAllPause,
    handleReset,
  } = useOfflineTimer(config, pauseMode);

  const seatOrder: number[][] = [
    [0, 1],
    [3, 2],
  ];

  const exit = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

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
                playerName={undefined}
                teamName={undefined}
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
          allPaused={allPaused}
          onToggleAllPause={toggleAllPause}
          spamProtectionActive={false}
          bell={undefined}
        />
      </View>

      {menuOpen && (
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <Pressable
            style={[
              styles.menuCard,
              { backgroundColor: colors.surfaceHigh, borderColor: colors.border },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.menuHeader}>
              <Text style={[type.eyebrow, { color: colors.textSecondary }]}>
                {t("offlineConfig.title")}
              </Text>
              <Pressable
                onPress={() => setMenuOpen(false)}
                accessibilityLabel={t("close")}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.menuGrid}>
              <MenuButton
                label={t("layout")}
                value={orientationMode === "side" ? t("layoutSide") : t("layoutCentre")}
                icon="reorder-two-outline"
                onPress={toggleOrientationMode}
              />
              <MenuButton
                label={t("mode")}
                value={pauseMode === "quickplay" ? t("modeQuickplay") : t("modeSimultaneous")}
                icon="flash-outline"
                onPress={togglePauseMode}
              />
            </View>

            <View style={styles.menuGrid}>
              <MenuButton
                label={t("resetTimers")}
                icon="refresh-outline"
                onPress={() => {
                  handleReset();
                  setMenuOpen(false);
                }}
              />
              <MenuButton
                label={t("closeTimer")}
                icon="exit-outline"
                danger
                onPress={exit}
              />
            </View>
          </Pressable>
        </Pressable>
      )}
    </View>
  );
}

function MenuButton({
  label,
  value,
  icon,
  danger,
  onPress,
}: {
  label: string;
  value?: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  danger?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const tint = danger ? colors.error : colors.text;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuButton,
        { borderColor: colors.border, backgroundColor: colors.surface },
        pressed && { backgroundColor: colors.surfaceHigh },
      ]}
    >
      <Ionicons name={icon} size={18} color={tint} />
      <View style={styles.menuButtonText}>
        <Text style={[type.bodySmall, { color: tint }]} numberOfLines={1}>
          {label}
        </Text>
        {value ? (
          <Text style={[type.caption, { color: colors.textMuted }]} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
      </View>
    </Pressable>
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
  backdrop: {
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
    width: "70%",
    maxWidth: 460,
    borderRadius: ui.sheetRadius,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    paddingBottom: 2,
  },
  menuGrid: {
    flexDirection: "row",
    gap: 8,
  },
  menuButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  menuButtonText: {
    flex: 1,
    gap: 2,
  },
});
