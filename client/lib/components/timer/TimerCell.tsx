import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { type } from "@/lib/theme/typography";
import { formatTime } from "@/lib/utils";
import { buildPlayerColor } from "@/lib/utils/timerColors";
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

const PLAYER_COUNT = 4;
const rotations = ["180deg", "180deg", "0deg", "0deg"] as const;

const TEXT_SHADOW = {
  textShadowColor: "rgba(0,0,0,0.8)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 4,
} as const;

type PlayerColor = ReturnType<typeof buildPlayerColor>;

type Props = {
  idx: number;
  playerName: string | undefined;
  timeLeft: number;
  totalSeconds: number;
  direction: "up" | "down";
  activeIdx: number | null;
  paused: boolean;
  playersInOvertime: boolean[];
  playerColor: PlayerColor;
  depleteAnim: Animated.Value;
  cellSize: { w: number; h: number };
  onPress: () => void;
  onLayout?: (e: LayoutChangeEvent) => void;
};

export function TimerCell({
  idx,
  playerName,
  timeLeft,
  totalSeconds,
  direction,
  activeIdx,
  paused,
  playersInOvertime,
  playerColor,
  depleteAnim,
  cellSize,
  onPress,
  onLayout,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation(["timer"]);

  const isRunning = activeIdx === idx && !paused;
  const isPausedHere = activeIdx === idx && paused;
  const isDepleted = timeLeft <= 0 || playersInOvertime[idx];
  const rotation = rotations[idx] ?? "0deg";

  const isLeftCol = PLAYER_COUNT === 4 ? idx === 0 || idx === 3 : null;
  const overlayAnchor =
    PLAYER_COUNT === 4
      ? isLeftCol
        ? direction === "up" ? "right" : "left"
        : direction === "up" ? "left" : "right"
      : idx === 0
        ? direction === "up" ? "bottom" : "top"
        : direction === "up" ? "top" : "bottom";
  const overlayMax = PLAYER_COUNT === 4 ? cellSize.w : cellSize.h;
  const overlaySize = depleteAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, overlayMax],
  });
  const overlayStyle =
    PLAYER_COUNT === 4
      ? { top: 0, bottom: 0, [overlayAnchor]: 0, width: overlaySize }
      : { left: 0, right: 0, [overlayAnchor]: 0, height: overlaySize };

  const bgColor = isDepleted
    ? colors.error + "30"
    : direction === "up"
      ? isRunning
        ? playerColor.elapsed + "cc"
        : playerColor.elapsedMuted + "55"
      : isRunning
        ? playerColor.active + "cc"
        : playerColor.muted + "55";

  const timeColor = isDepleted
    ? colors.error
    : isRunning
      ? "#ffffff"
      : playerColor.active;

  return (
    <Pressable
      style={[styles.cell, { backgroundColor: bgColor }]}
      onPress={onPress}
      onLayout={onLayout}
    >
      <Animated.View
        style={[
          styles.depletionOverlay,
          {
            ...overlayStyle,
            backgroundColor: direction === "up"
              ? isRunning ? playerColor.active : playerColor.muted
              : isRunning ? playerColor.elapsed : playerColor.elapsedMuted,
          },
        ]}
        pointerEvents="none"
      />
      <View style={[styles.cellContent, { transform: [{ rotate: rotation }] }]}>
        <Text
          style={[
            type.eyebrow,
            { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
          ]}
        >
          {playerName ?? `P${idx + 1}`}
        </Text>
        <View style={styles.timeGroup}>
          <Text style={[styles.timeText, { color: timeColor, ...TEXT_SHADOW }]}>
            {direction === "up"
              ? formatTime(totalSeconds - timeLeft)
              : formatTime(timeLeft)}
          </Text>
          {direction === "up" && timeLeft <= 0 && (
            <Text style={[styles.overtimeText, { color: colors.error, ...TEXT_SHADOW }]}>
              +{formatTime(-timeLeft)}
            </Text>
          )}
          {isRunning && (
            <View style={[styles.activePip, { backgroundColor: "#ffffff" }]} />
          )}
        </View>
        {isPausedHere && (
          <Text style={[type.eyebrow, { color: colors.textMuted, marginTop: 4 }]}>
            {t("paused")}
          </Text>
        )}
        {isDepleted && (
          <Text style={[type.eyebrow, { color: colors.error, marginTop: 4, ...TEXT_SHADOW }]}>
            {t("timeOut")}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
    alignSelf: "stretch",
    alignItems: "center",
    gap: 4,
  },
  timeGroup: {
    width: "100%",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontFamily: "BarlowCondensed_800ExtraBold",
    fontSize: 64,
    lineHeight: 68,
    letterSpacing: -1,
    textAlign: "center",
    width: "100%",
  },
  activePip: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  overtimeText: {
    fontFamily: "BarlowCondensed_800ExtraBold",
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.5,
    textAlign: "center",
    width: "100%",
  },
});
