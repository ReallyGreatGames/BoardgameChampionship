import { useCallback, useState } from "react";

export type DurationRoundInitial = {
  duration?: number;
  roundSeconds?: number;
  direction?: "up" | "down";
};

/**
 * Shared duration/round-time/direction field state + validation for
 * CustomTimerModal and TimerSettingsModal — keeps the "0 or blank means
 * disabled" round-seconds rule and the duration-blur-clearing UX in exactly
 * one place instead of drifting between the two forms (which is exactly
 * what TimerDurationFields.tsx's own extraction was meant to prevent, but
 * only covered the JSX half).
 */
export function useDurationRoundFields() {
  const [duration, setDurationState] = useState("");
  const [roundSeconds, setRoundSeconds] = useState("");
  const [direction, setDirection] = useState<"up" | "down">("down");
  const [saving, setSaving] = useState(false);
  const [durBlurred, setDurBlurred] = useState(false);

  const durNum = parseInt(duration, 10);
  const durValid = !isNaN(durNum) && durNum > 0;
  const roundSecondsNum = roundSeconds.trim() === "" ? 0 : parseInt(roundSeconds, 10);
  const roundSecondsValid = !isNaN(roundSecondsNum) && roundSecondsNum >= 0;
  const isValid = durValid && roundSecondsValid;

  const setDuration = useCallback((v: string) => {
    setDurationState(v);
    setDurBlurred((wasBlurred) => {
      if (!wasBlurred) {
        return wasBlurred;
      }
      const n = parseInt(v, 10);
      return !isNaN(n) && n > 0 ? false : wasBlurred;
    });
  }, []);

  const onDurationBlur = useCallback(() => setDurBlurred(true), []);

  /** (Re)initializes the form — called when a modal opens. `initial.duration`
   *  is per-player minutes (matches what's displayed); pass the already-
   *  divided value. `!= null` (not truthy) so a deliberately-saved `0`
   *  round-time shows as "0" instead of looking unconfigured. */
  const reset = useCallback((initial?: DurationRoundInitial) => {
    setDurationState(initial?.duration != null ? String(initial.duration) : "");
    setRoundSeconds(initial?.roundSeconds != null ? String(initial.roundSeconds) : "");
    setDirection(initial?.direction ?? "down");
    setSaving(false);
    setDurBlurred(false);
  }, []);

  return {
    duration,
    roundSeconds,
    direction,
    saving,
    durNum,
    durValid,
    roundSecondsNum,
    roundSecondsValid,
    isValid,
    durationInvalid: durBlurred && duration !== "" && !durValid,
    roundSecondsInvalid: roundSeconds !== "" && !roundSecondsValid,
    setDuration,
    setRoundSeconds,
    setDirection,
    setSaving,
    onDurationBlur,
    reset,
  };
}
