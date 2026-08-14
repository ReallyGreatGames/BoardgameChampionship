import { useCallback } from "react";
import { useSecureStoragePerGame } from "./useSecureStoragePerGame";

export type TimerOrientationMode = "center" | "side";
export type TimerPauseMode = "auto" | "manual";

const DEFAULT_ORIENTATION: TimerOrientationMode = "center";
const DEFAULT_PAUSE_MODE: TimerPauseMode = "auto";

const parseOrientation = (v: string): TimerOrientationMode =>
  v === "side" ? "side" : DEFAULT_ORIENTATION;
const parsePauseMode = (v: string): TimerPauseMode =>
  v === "manual" ? "manual" : DEFAULT_PAUSE_MODE;

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
