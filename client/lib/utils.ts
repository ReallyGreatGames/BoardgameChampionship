import type { Player } from "./models/player";
import type { Timer } from "./models/timer";

export const EMPTY = Symbol("empty");

export const WRITE_PACING_MS = 750;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {},
): Promise<T> {
  const { maxRetries = 4, initialDelay = 1000, shouldRetry = () => true } = options;
  let delay = initialDelay;
  let attempt = 0;
  do {
    try {
      return await fn();
    } catch (e: unknown) {
      if (shouldRetry(e) && attempt < maxRetries) {
        await sleep(delay);
        delay *= 2;
        attempt++;
      } else {
        throw e;
      }
    }
  } while (true);
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function formatTime(s: number): string {
  const clamped = Math.max(0, s);
  const m = Math.floor(clamped / 60).toString().padStart(2, "0");
  const sec = (clamped % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export function formatElapsed(startTime: string, now: number): string {
  const s = Math.floor((now - new Date(startTime).getTime()) / 1000);
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export function formatElapsedSeconds(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function computeTableElapsedSeconds(
  accumulatedMs: number,
  resumedAtIso: string | null | undefined,
  now: number,
): number {
  const resumedAt = resumedAtIso ? new Date(resumedAtIso).getTime() : null;
  const liveMs = resumedAt !== null ? Math.max(0, now - resumedAt) : 0;
  return Math.floor((accumulatedMs + liveMs) / 1000);
}

export type RoundPoolReconcileResult = {
  poolTimes: number[];
  roundTimesLeft: number[];
  roundExpired: boolean[];
};

export function reconcileRoundAndPool(
  poolTimes: number[],
  roundTimesLeft: number[],
  roundExpired: boolean[],
  pausedFlags: boolean[],
  roundSecondsTotal: number,
  updatedAt: string[],
  now: number,
): RoundPoolReconcileResult {
  const nextPool = [...poolTimes];
  const nextRound = [...roundTimesLeft];
  const nextExpired = [...roundExpired];
  for (let i = 0; i < poolTimes.length; i++) {
    if (pausedFlags[i]) {
      continue;
    }
    let remaining = Math.max(0, Math.floor((now - new Date(updatedAt[i]).getTime()) / 1000));
    if (remaining === 0) {
      continue;
    }
    if (roundSecondsTotal > 0 && !nextExpired[i]) {
      const consumed = Math.min(remaining, nextRound[i]);
      nextRound[i] -= consumed;
      remaining -= consumed;
      if (nextRound[i] <= 0) {
        nextExpired[i] = true;
      }
    }
    if (remaining > 0) {
      nextPool[i] -= remaining;
    }
  }
  return { poolTimes: nextPool, roundTimesLeft: nextRound, roundExpired: nextExpired };
}

export function toNumberArray(value: unknown): number[] {
  if (Array.isArray(value)) { return value as number[]; }
  if (typeof value === "string") {
    try { return JSON.parse(value) as number[]; } catch { return []; }
  }
  return [];
}

export function toBooleanArray(value: unknown): boolean[] {
  if (Array.isArray(value)) { return value as boolean[]; }
  if (typeof value === "string") {
    try { return JSON.parse(value) as boolean[]; } catch { return []; }
  }
  return [];
}

export function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) { return false; }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) { return false; }
  }
  return true;
}

export type EffectiveTimerSettings = {
  hasCustomTimer: boolean;
  effectiveDuration: number | undefined;
  roundSecondsTotal: number;
  direction: NonNullable<Timer["direction"]>;
};

export function resolveEffectiveTimer(
  timer:
    | Pick<Timer, "hasCustomTimer" | "durationMinutesTotal" | "roundSecondsTotal" | "direction">
    | undefined,
  gameSettings:
    | { durationMinutesTotal?: number; roundSecondsTotal?: number; direction?: Timer["direction"] }
    | undefined,
): EffectiveTimerSettings {
  const hasCustomTimer =
    timer?.hasCustomTimer === true ||
    (timer?.hasCustomTimer === undefined && !!timer?.durationMinutesTotal);
  const effectiveDuration = hasCustomTimer
    ? timer?.durationMinutesTotal || gameSettings?.durationMinutesTotal
    : gameSettings?.durationMinutesTotal;
  const roundSecondsTotal = hasCustomTimer
    ? timer?.roundSecondsTotal ?? 0
    : gameSettings?.roundSecondsTotal || 0;
  const direction = hasCustomTimer
    ? timer?.direction ?? gameSettings?.direction ?? "down"
    : gameSettings?.direction ?? "down";
  return { hasCustomTimer, effectiveDuration, roundSecondsTotal, direction };
}

export function formatPoints(points: number): string {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}

export function teamName(player: Player): string {
  return typeof player.team === "string" ? player.team : player.team.name;
}

export function injectViewBox(xml: string): string {
  if (xml.includes("viewBox")) { return xml; }
  return xml.replace(/<svg([^>]*)>/, (_, attrs: string) => {
    const w = attrs.match(/width="([^"]+)"/)?.[1];
    const h = attrs.match(/height="([^"]+)"/)?.[1];
    if (!w || !h) { return `<svg${attrs}>`; }
    return `<svg${attrs} viewBox="0 0 ${w} ${h}">`;
  });
}

export function resolveGameId(ref: unknown): string | null {
  if (!ref) { return null; }
  if (typeof ref === "string") { return ref; }
  if (Array.isArray(ref)) {
    const first = ref[0];
    if (!first) { return null; }
    return typeof first === "string" ? first : (first as any).$id ?? null;
  }
  return (ref as any).$id ?? null;
}
