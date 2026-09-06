import { useEffect, useMemo, useState } from "react";
import { Schedule } from "@/lib/models/schedule";
import { formatElapsedSeconds } from "@/lib/utils";

export type RoundCountdown = {
  secondsLeft: number;
  label: string;
  isOvertime: boolean;
};

const IDLE: RoundCountdown = { secondsLeft: 0, label: "--:--", isOvertime: false };

function plannedEndMs(startTimePlanned: string, durationPlanned: number, now: number): number {
  const [hours, minutes] = startTimePlanned.split(":").map(Number);
  const start = new Date(now);
  start.setHours(hours, minutes, 0, 0);
  return start.getTime() + durationPlanned * 60000;
}

export function useRoundCountdown(item: Schedule | null | undefined): RoundCountdown {
  const startTimePlanned = item?.startTimePlanned;
  const durationPlanned = item?.durationPlanned;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startTimePlanned || durationPlanned === undefined) {
      return;
    }
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startTimePlanned, durationPlanned]);

  return useMemo(() => {
    if (!startTimePlanned || durationPlanned === undefined) {
      return IDLE;
    }
    const diff = Math.round((plannedEndMs(startTimePlanned, durationPlanned, now) - now) / 1000);
    return {
      secondsLeft: Math.max(0, diff),
      label: formatElapsedSeconds(Math.abs(diff)),
      isOvertime: diff <= 0,
    };
  }, [startTimePlanned, durationPlanned, now]);
}
