import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  useWindowDimensions,
} from "react-native";
import { buildPlayerColor, PLAYER_COLORS } from "@/lib/utils/timerColors";
import { TimerPauseMode } from "./useTimerLocalSettings";

const PLAYER_COUNT = 4;
const ROUND_RESET_GRACE_MS = 3000;

export type OfflineTimerConfig = {
  perPlayerMinutes: number;
  roundSecondsTotal: number;
  direction: "up" | "down";
};

type TickState = {
  times: number[];
  roundTimesLeft: number[];
  roundExpired: boolean[];
  playersInOvertime: boolean[];
};

function makeTickState(
  totalSeconds: number,
  roundSecondsTotal: number,
): TickState {
  return {
    times: Array(PLAYER_COUNT).fill(totalSeconds),
    roundTimesLeft: Array(PLAYER_COUNT).fill(roundSecondsTotal),
    roundExpired: Array(PLAYER_COUNT).fill(false),
    playersInOvertime: Array(PLAYER_COUNT).fill(false),
  };
}

function makeAnimatedValueArray(): Animated.Value[] {
  return Array.from({ length: PLAYER_COUNT }, () => new Animated.Value(0));
}

function startGrace(anim: Animated.Value, durationMs: number): void {
  anim.stopAnimation();
  anim.setValue(0);
  Animated.timing(anim, {
    toValue: 1,
    duration: durationMs,
    easing: Easing.linear,
    useNativeDriver: false,
  }).start();
}

function clearGrace(anim: Animated.Value): void {
  anim.stopAnimation();
  anim.setValue(0);
}

export function useOfflineTimer(
  config: OfflineTimerConfig,
  pauseMode: TimerPauseMode,
) {
  const { width, height } = useWindowDimensions();

  const totalSeconds = Math.max(1, Math.round(config.perPlayerMinutes * 60));
  const roundSecondsTotal = Math.max(0, Math.round(config.roundSecondsTotal));
  const direction = config.direction;

  const [tickState, setTickState] = useState<TickState>(() =>
    makeTickState(totalSeconds, roundSecondsTotal),
  );
  const [playersPaused, setPlayersPaused] = useState<boolean[]>(() =>
    Array(PLAYER_COUNT).fill(true),
  );
  const [cellSize, setCellSize] = useState({ w: width / 2, h: height / 2 });

  const depleteAnims = useRef(makeAnimatedValueArray());
  const graceAnims = useRef(makeAnimatedValueArray());
  const lastPausedAtRef = useRef<(number | null)[]>(
    Array(PLAYER_COUNT).fill(null),
  );

  const playersPausedRef = useRef(playersPaused);
  const tickStateRef = useRef(tickState);

  useEffect(() => {
    playersPausedRef.current = playersPaused;
  }, [playersPaused]);

  useEffect(() => {
    tickStateRef.current = tickState;
  }, [tickState]);

  const playerColors = useMemo(
    () =>
      Array.from({ length: PLAYER_COUNT }, (_, i) =>
        buildPlayerColor(PLAYER_COLORS[i % PLAYER_COLORS.length].active),
      ),
    [],
  );

  const pauseSeat = useCallback((seat: number, now: number) => {
    lastPausedAtRef.current[seat] = now;
    startGrace(graceAnims.current[seat], ROUND_RESET_GRACE_MS);
  }, []);

  useEffect(() => {
    if (!playersPaused.some((p) => !p)) {
      return;
    }
    const interval = setInterval(() => {
      setTickState((prev) => {
        const times = [...prev.times];
        const roundTimesLeft = [...prev.roundTimesLeft];
        const roundExpired = [...prev.roundExpired];
        const playersInOvertime = [...prev.playersInOvertime];

        for (let i = 0; i < PLAYER_COUNT; i++) {
          if (playersPausedRef.current[i]) {
            continue;
          }

          if (roundSecondsTotal > 0 && !roundExpired[i]) {
            roundTimesLeft[i] -= 1;
            if (roundTimesLeft[i] <= 0) {
              roundExpired[i] = true;
            }
          } else {
            times[i] -= 1;
            if (times[i] <= 0) {
              playersInOvertime[i] = true;
            }
            Animated.timing(depleteAnims.current[i], {
              toValue: Math.min(1, Math.max(0, 1 - times[i] / totalSeconds)),
              duration: 950,
              useNativeDriver: false,
            }).start();
          }
        }

        return { times, roundTimesLeft, roundExpired, playersInOvertime };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [playersPaused, totalSeconds, roundSecondsTotal]);

  const handlePress = useCallback(
    (idx: number) => {
      const now = Date.now();
      const currentPaused = playersPausedRef.current;
      const currentTick = tickStateRef.current;
      const wasPaused = currentPaused[idx];

      const nextPaused = [...currentPaused];
      let nextRoundTimesLeft = currentTick.roundTimesLeft;
      let nextRoundExpired = currentTick.roundExpired;

      if (pauseMode === "quickplay" && wasPaused) {
        for (let i = 0; i < PLAYER_COUNT; i++) {
          if (i !== idx && !nextPaused[i]) {
            nextPaused[i] = true;
            pauseSeat(i, now);
          }
        }
      }

      nextPaused[idx] = !wasPaused;

      if (nextPaused[idx]) {
        pauseSeat(idx, now);
      } else {
        const lastPausedAt = lastPausedAtRef.current[idx];
        const withinGrace =
          lastPausedAt !== null && now - lastPausedAt < ROUND_RESET_GRACE_MS;
        if (!withinGrace) {
          const roundTimesLeft = [...nextRoundTimesLeft];
          const roundExpired = [...nextRoundExpired];
          roundTimesLeft[idx] = roundSecondsTotal;
          roundExpired[idx] = false;
          nextRoundTimesLeft = roundTimesLeft;
          nextRoundExpired = roundExpired;
        }
        clearGrace(graceAnims.current[idx]);
        lastPausedAtRef.current[idx] = null;
      }

      const nextTick = {
        ...currentTick,
        roundTimesLeft: nextRoundTimesLeft,
        roundExpired: nextRoundExpired,
      };
      playersPausedRef.current = nextPaused;
      tickStateRef.current = nextTick;
      setPlayersPaused(nextPaused);
      setTickState(nextTick);
    },
    [pauseMode, pauseSeat, roundSecondsTotal],
  );

  const toggleAllPause = useCallback(() => {
    const now = Date.now();
    const currentPaused = playersPausedRef.current;
    const currentTick = tickStateRef.current;
    const wasAllPaused = currentPaused.every(Boolean);
    const nextPaused = Array(PLAYER_COUNT).fill(!wasAllPaused);
    let nextRoundTimesLeft = currentTick.roundTimesLeft;
    let nextRoundExpired = currentTick.roundExpired;

    if (wasAllPaused) {
      for (let i = 0; i < PLAYER_COUNT; i++) {
        const lastPausedAt = lastPausedAtRef.current[i];
        const withinGrace =
          lastPausedAt !== null && now - lastPausedAt < ROUND_RESET_GRACE_MS;
        if (!withinGrace) {
          const roundTimesLeft = [...nextRoundTimesLeft];
          const roundExpired = [...nextRoundExpired];
          roundTimesLeft[i] = roundSecondsTotal;
          roundExpired[i] = false;
          nextRoundTimesLeft = roundTimesLeft;
          nextRoundExpired = roundExpired;
        }
        clearGrace(graceAnims.current[i]);
        lastPausedAtRef.current[i] = null;
      }
    } else {
      for (let i = 0; i < PLAYER_COUNT; i++) {
        if (!currentPaused[i]) {
          pauseSeat(i, now);
        }
      }
    }

    const nextTick = {
      ...currentTick,
      roundTimesLeft: nextRoundTimesLeft,
      roundExpired: nextRoundExpired,
    };
    playersPausedRef.current = nextPaused;
    tickStateRef.current = nextTick;
    setPlayersPaused(nextPaused);
    setTickState(nextTick);
  }, [pauseSeat, roundSecondsTotal]);

  const handleReset = useCallback(() => {
    const fresh = makeTickState(totalSeconds, roundSecondsTotal);
    const freshPaused = Array(PLAYER_COUNT).fill(true);
    tickStateRef.current = fresh;
    playersPausedRef.current = freshPaused;
    lastPausedAtRef.current = Array(PLAYER_COUNT).fill(null);
    depleteAnims.current.forEach((anim) => anim.setValue(0));
    graceAnims.current.forEach((anim) => clearGrace(anim));
    setTickState(fresh);
    setPlayersPaused(freshPaused);
  }, [totalSeconds, roundSecondsTotal]);

  const handleCellLayout = useCallback((e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setCellSize({ w, h });
  }, []);

  const allPaused = playersPaused.every(Boolean);

  return {
    times: tickState.times,
    roundTimesLeft: tickState.roundTimesLeft,
    roundExpired: tickState.roundExpired,
    playersInOvertime: tickState.playersInOvertime,
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
  };
}
