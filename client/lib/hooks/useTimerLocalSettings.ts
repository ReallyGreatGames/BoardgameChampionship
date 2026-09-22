import { useCallback } from "react";
import { useSecureStoragePerGame } from "./useSecureStoragePerGame";

export type TimerOrientationMode = "center" | "side";
export type TimerPauseMode = "quickplay" | "simultaneous";

const DEFAULT_ORIENTATION: TimerOrientationMode = "center";
const DEFAULT_PAUSE_MODE: TimerPauseMode = "quickplay";

const parseOrientation = (v: string): TimerOrientationMode =>
  v === "side" ? "side" : DEFAULT_ORIENTATION;
const parsePauseMode = (v: string): TimerPauseMode =>
  v === "simultaneous" ? "simultaneous" : DEFAULT_PAUSE_MODE;

export function useTimerLocalSettings(gameId: string | undefined) {
  const [orientationMode, setOrientationMode] = useSecureStoragePerGame(
    "timerOrientation",
    gameId,
    DEFAULT_ORIENTATION,
    parseOrientation,
  );
  const [pauseMode, setPauseMode] = useSecureStoragePerGame(
    "timerPauseMode",
    gameId,
    DEFAULT_PAUSE_MODE,
    parsePauseMode,
  );

  const toggleOrientationMode = useCallback(() => {
    setOrientationMode(orientationMode === "center" ? "side" : "center");
  }, [orientationMode, setOrientationMode]);

  const togglePauseMode = useCallback(() => {
    setPauseMode(pauseMode === "quickplay" ? "simultaneous" : "quickplay");
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
