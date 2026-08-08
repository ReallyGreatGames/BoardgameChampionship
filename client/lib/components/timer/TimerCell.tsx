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
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TimerOrientationMode } from "@/lib/hooks/useTimerLocalSettings";

const PLAYER_COUNT = 4;
/** Rotation per seat index for "center" orientation — text faces outward, as
 *  if the app sits in the middle of the table. "side" orientation skips this
 *  entirely so every seat's text faces the same direction (see timer.tsx). */
const CENTER_ROTATIONS = ["180deg", "180deg", "0deg", "0deg"] as const;

const TEXT_SHADOW = {
  textShadowColor: "rgba(0,0,0,0.8)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 4,
} as const;

// Fixed (theme-independent) colors for the small badges overlaid on the cell.
// The cell's own background is an arbitrary, often-dark player color, so
// theme tokens like `colors.textMuted`/`colors.primary` can't be relied on
// for contrast — a translucent dark backdrop + light border keeps these
// legible against any player color, same reasoning as TEXT_SHADOW above.
const BADGE_BG = "rgba(0,0,0,0.4)";
const BADGE_BORDER = "rgba(255,255,255,0.55)";
const NAME_TEXT_COLOR = "#f2f6fb";
const ROUND_BADGE_TEXT_COLOR = "#a9d4ff";

type PlayerColor = ReturnType<typeof buildPlayerColor>;

type Props = {
  idx: number;
  playerName: string | undefined;
  timeLeft: number;
  totalSeconds: number;
  direction: "up" | "down";
  isPaused: boolean;
  playersInOvertime: boolean[];
  roundSecondsTotal: number;
  roundTimeLeft: number;
  roundExpired: boolean;
  orientationMode: TimerOrientationMode;
  playerColor: PlayerColor;
  depleteAnim: Animated.Value;
  graceAnim: Animated.Value;
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
  isPaused,
  playersInOvertime,
  roundSecondsTotal,
  roundTimeLeft,
  roundExpired,
  orientationMode,
  playerColor,
  depleteAnim,
  graceAnim,
  cellSize,
  onPress,
  onLayout,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation(["timer"]);

  const isRunning = !isPaused;
  const isDepleted = playersInOvertime[idx];
  const rotation = orientationMode === "side" ? "0deg" : CENTER_ROTATIONS[idx] ?? "0deg";

  // graceAnim reaching 1 means the 3s pause-safety window has fully charged
  // — resuming now would reset the round. Mirrored into real state (not just
  // an opacity interpolation) so the badge doesn't just fade invisible while
  // still holding its layout spot — the pool time needs to actually take
  // over the big center spot at that point, same as a genuinely expired round.
  // The swap itself is delayed slightly past the threshold so the bar
  // actually gets to render fully charged for a moment first, instead of the
  // badge (and the bar with it) disappearing in the same instant it finishes.
  const [graceExpired, setGraceExpired] = useState(false);
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const id = graceAnim.addListener(({ value }) => {
      if (value >= 0.999) {
        if (timeoutId === null) {
          timeoutId = setTimeout(() => setGraceExpired(true), 400);
        }
      } else {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        setGraceExpired(false);
      }
    });
    return () => {
      graceAnim.removeListener(id);
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [graceAnim]);

  // While a round is running (and its grace window hasn't already run out),
  // the round badge (shield + countdown, styled as a badge — border,
  // background, icon) takes over the big, centered spot; the pool time
  // shrinks to a small line above it. The instant the round expires — or its
  // grace window runs out while paused — the badge is gone entirely and the
  // pool time takes back the big center spot, exactly as without round-time.
  const roundActive = roundSecondsTotal > 0 && !roundExpired;
  const showBadge = roundActive && !graceExpired;
  // "TIME OUT" only makes sense when the pool is the thing being shown big.
  const showTimeOut = isDepleted && !showBadge;

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

  // While a round is active, the "overtime" look (both background and time
  // text) is ignored entirely — the round itself hasn't run out, so showing
  // it in red would be misleading even if this seat's pool is already
  // negative from an earlier round.
  const showOvertimeLook = isDepleted && !roundActive;

  const bgColor = showOvertimeLook
    ? colors.error + "30"
    : direction === "up"
      ? isRunning
        ? playerColor.elapsed + "cc"
        : playerColor.elapsedMuted + "55"
      : isRunning
        ? playerColor.active + "cc"
        : playerColor.muted + "55";

  const runningColor = isRunning ? "#ffffff" : playerColor.active;
  const timeColor = showOvertimeLook ? colors.error : runningColor;

  // `timeLeft` always ticks down uniformly regardless of direction and can go
  // negative once the pool is exhausted (see useTimerState.ts) — the base
  // line freezes at the pool total once depleted, with the overage shown
  // separately, symmetric for both count directions.
  const overageSeconds = Math.max(0, -timeLeft);
  const baseSeconds =
    direction === "up"
      ? Math.min(totalSeconds, totalSeconds - timeLeft)
      : Math.max(0, timeLeft);
  // Round time always counts down, regardless of the pool's direction — it's
  // a fixed per-round budget draining toward zero, not a running total.
  const roundBaseSeconds = Math.max(0, roundTimeLeft);

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
        <View style={styles.nameBadge}>
          <Text
            style={[
              type.eyebrow,
              { color: NAME_TEXT_COLOR, fontSize: 14, lineHeight: 20 },
            ]}
          >
            {playerName ?? `P${idx + 1}`}
          </Text>
        </View>

        {showBadge ? (
          <>
            {/* Pool time, small, above the round badge — takes back the big
                spot below the instant the badge disappears (round expired,
                or its grace window ran out while paused). */}
            <Text style={[styles.smallPoolText, { color: NAME_TEXT_COLOR, ...TEXT_SHADOW }]}>
              {formatTime(baseSeconds)}
            </Text>

            {/* The badge itself is the big, centered element while the round
                is running and still within its grace window. */}
            <View style={styles.roundBigWrap}>
              <View style={styles.roundBigBadge}>
                <Text style={[styles.roundBigBadgeText, { color: ROUND_BADGE_TEXT_COLOR }]}>
                  {formatTime(roundBaseSeconds)}
                </Text>
              </View>

              {isRunning && (
                <View style={[styles.activePip, { backgroundColor: "#ffffff" }]} />
              )}
            </View>
          </>
        ) : (
          <View style={styles.timeGroup}>
            <Text style={[styles.timeText, { color: timeColor, ...TEXT_SHADOW }]}>
              {formatTime(baseSeconds)}
            </Text>
            {isDepleted && overageSeconds > 0 && (
              <Text style={[styles.overtimeText, { color: colors.error, ...TEXT_SHADOW }]}>
                +{formatTime(overageSeconds)}
              </Text>
            )}
            {isRunning && (
              <View style={[styles.activePip, { backgroundColor: "#ffffff" }]} />
            )}
          </View>
        )}

        {/* Visible whenever paused and a round system is configured — shows
            whether resuming now would reset the round — independent of
            whether the shield badge itself is currently displayed (it isn't
            once the round has expired or its own grace window already ran
            out, but resuming after a long-enough pause still resets it). */}
        {isPaused && roundSecondsTotal > 0 && (
          <View style={[styles.graceTrack, { backgroundColor: colors.border }]}>
            <Animated.View
              style={[
                styles.graceFill,
                {
                  backgroundColor: colors.primary,
                  width: graceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
        )}

        {isPaused && !showTimeOut && (
          <Text style={[type.eyebrow, { color: colors.textMuted, marginTop: 4 }]}>
            {t("paused")}
          </Text>
        )}

        {showTimeOut && (
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
  nameBadge: {
    backgroundColor: BADGE_BG,
    borderWidth: 1,
    borderColor: BADGE_BORDER,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  smallPoolText: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  roundBigWrap: {
    alignItems: "center",
    gap: 6,
  },
  roundBigBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: BADGE_BG,
    borderWidth: 1.5,
    borderColor: BADGE_BORDER,
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  roundBigBadgeText: {
    fontFamily: "BarlowCondensed_800ExtraBold",
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -1,
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
  graceTrack: {
    width: 60,
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 2,
  },
  graceFill: {
    height: "100%",
  },
});
