import { useCallback, useEffect, useState } from "react";
import { getItemAsync, setItemAsync } from "@/lib/secureStorage";

export type TimerOrientationMode = "center" | "side";
export type TimerPauseMode = "auto" | "manual";

const DEFAULT_ORIENTATION: TimerOrientationMode = "center";
const DEFAULT_PAUSE_MODE: TimerPauseMode = "auto";

/**
 * Orientation and pause-mode are display/interaction preferences only — they
 * never sync to the Timer document. Stored locally per gameId, mirroring the
 * player-color pattern in game.tsx/useTimerState.ts (secureStorage keyed by
 * `..._${gameId}`), since the seating/device setup is decided per game.
 */
export function useTimerLocalSettings(gameId: string | undefined) {
  const [orientationMode, setOrientationModeState] =
    useState<TimerOrientationMode>(DEFAULT_ORIENTATION);
  const [pauseMode, setPauseModeState] = useState<TimerPauseMode>(DEFAULT_PAUSE_MODE);

  useEffect(() => {
    if (!gameId) {
      setOrientationModeState(DEFAULT_ORIENTATION);
      setPauseModeState(DEFAULT_PAUSE_MODE);
      return;
    }
    getItemAsync(`timerOrientation_${gameId}`).then((v) => {
      setOrientationModeState(v === "side" ? "side" : DEFAULT_ORIENTATION);
    });
    getItemAsync(`timerPauseMode_${gameId}`).then((v) => {
      setPauseModeState(v === "manual" ? "manual" : DEFAULT_PAUSE_MODE);
    });
  }, [gameId]);

  const setOrientationMode = useCallback(
    (mode: TimerOrientationMode) => {
      setOrientationModeState(mode);
      if (gameId) {
        setItemAsync(`timerOrientation_${gameId}`, mode);
      }
    },
    [gameId],
  );

  const setPauseMode = useCallback(
    (mode: TimerPauseMode) => {
      setPauseModeState(mode);
      if (gameId) {
        setItemAsync(`timerPauseMode_${gameId}`, mode);
      }
    },
    [gameId],
  );

  const toggleOrientationMode = useCallback(() => {
    setOrientationMode(orientationMode === "center" ? "side" : "center");
  }, [orientationMode, setOrientationMode]);

  const togglePauseMode = useCallback(() => {
    setPauseMode(pauseMode === "auto" ? "manual" : "auto");
  }, [pauseMode, setPauseMode]);

  return {
    orientationMode,
    pauseMode,
    setOrientationMode,
    setPauseMode,
    toggleOrientationMode,
    togglePauseMode,
  };
}
