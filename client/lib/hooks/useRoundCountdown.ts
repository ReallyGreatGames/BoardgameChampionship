import { useEffect, useMemo, useState } from "react";
import { Schedule } from "@/lib/models/schedule";
import { computeTableElapsedSeconds, formatElapsedSeconds } from "@/lib/utils";

export type RoundCountdown = {
  secondsLeft: number;
  label: string;
  isOvertime: boolean;
  isPaused: boolean;
};

const IDLE: RoundCountdown = {
  secondsLeft: 0,
  label: "--:--",
  isOvertime: false,
  isPaused: false,
};

export function useRoundCountdown(item: Schedule | null | undefined): RoundCountdown {
  const durationPlanned = item?.durationPlanned;
  const activeAccumulatedMs = item?.activeAccumulatedMs ?? 0;
  const activeResumedAt = item?.activeResumedAt || null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (durationPlanned === undefined || !activeResumedAt) {
      return;
    }
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [durationPlanned, activeResumedAt]);

  return useMemo(() => {
    if (durationPlanned === undefined) {
      return IDLE;
    }
    const totalSeconds = durationPlanned * 60;
    const elapsedSeconds = computeTableElapsedSeconds(
      activeAccumulatedMs,
      activeResumedAt,
      now,
    );
    const diff = totalSeconds - elapsedSeconds;
    return {
      secondsLeft: Math.max(0, diff),
      label: formatElapsedSeconds(Math.abs(diff)),
      isOvertime: diff <= 0,
      isPaused: !activeResumedAt,
    };
  }, [durationPlanned, activeAccumulatedMs, activeResumedAt, now]);
}
