import { useCallback, useState } from "react";

export type DurationRoundInitial = {
  duration?: number;
  roundSeconds?: number;
  direction?: "up" | "down";
};

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
