import type { Player } from "./models/player";
import type { Timer } from "./models/timer";

export const EMPTY = Symbol("empty");

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

export type RoundPoolReconcileResult = {
  poolTimes: number[];
  roundTimesLeft: number[];
  roundExpired: boolean[];
};

/** Fast-forwards each unpaused seat's round time and pool time for elapsed
 *  real time since the timer doc was last saved — saves only happen on
 *  press/pause/reset, not every tick. Consumes round time first (while
 *  `roundSecondsTotal > 0` and the seat hasn't already expired its round),
 *  then spills any remaining elapsed seconds onto the pool — mirrors what
 *  useTimerState.ts's per-second tick loop would have done. Used both by the
 *  interactive timer (on reconnect) and the read-only results dashboard, so
 *  pool time never appears to drain during a seat's round-time phase. */
export function reconcileRoundAndPool(
  poolTimes: number[],
  roundTimesLeft: number[],
  roundExpired: boolean[],
  pausedFlags: boolean[],
  roundSecondsTotal: number,
  updatedAt: string,
  now: number,
): RoundPoolReconcileResult {
  const elapsedTotal = Math.max(0, Math.floor((now - new Date(updatedAt).getTime()) / 1000));
  if (elapsedTotal === 0) {
    return { poolTimes, roundTimesLeft, roundExpired };
  }
  const nextPool = [...poolTimes];
  const nextRound = [...roundTimesLeft];
  const nextExpired = [...roundExpired];
  for (let i = 0; i < poolTimes.length; i++) {
    if (pausedFlags[i]) {
      continue;
    }
    let remaining = elapsedTotal;
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

/** Normalizes playerTimes — real-time payloads may serialize arrays as JSON strings */
export function toNumberArray(value: unknown): number[] {
  if (Array.isArray(value)) {return value as number[];}
  if (typeof value === "string") {
    try { return JSON.parse(value) as number[]; } catch { return []; }
  }
  return [];
}

export function toBooleanArray(value: unknown): boolean[] {
  if (Array.isArray(value)) {return value as boolean[];}
  if (typeof value === "string") {
    try { return JSON.parse(value) as boolean[]; } catch { return []; }
  }
  return [];
}

/** Value-equality for flat arrays of primitives — cheaper than a
 *  `JSON.stringify` comparison and used on hot paths (e.g. detecting a
 *  realtime update that's just the echo of this device's own write). */
export function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) {return false;}
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {return false;}
  }
  return true;
}

export type EffectiveTimerSettings = {
  /** Whether this table has a deliberate per-table override — see below. */
  hasCustomTimer: boolean;
  effectiveDuration: number | undefined;
  roundSecondsTotal: number;
  direction: NonNullable<Timer["direction"]>;
};

/** Resolves the timer settings that actually apply to a table: its own
 *  deliberate override, or the game's default. `hasCustomTimer` is the
 *  authoritative signal for "this table was customized" — durationMinutesTotal/
 *  roundSecondsTotal are numbers Appwrite defaults to `0` when never
 *  explicitly set, indistinguishable from a deliberately-chosen `0` (e.g.
 *  round timer disabled on purpose) without it.
 *
 *  Timer docs saved before `hasCustomTimer` existed have the field as
 *  `undefined` but may still carry a genuine custom duration from back then
 *  — inferred from that instead of silently losing the override on rollout.
 *  A table explicitly reverted via "use default timer" has `hasCustomTimer
 *  === false` set deliberately, which must NOT fall into that legacy
 *  inference (checked via `=== undefined`, not just falsy).
 *
 *  Shared by the live timer (useTimerState.ts) and the read-only results
 *  dashboard (ResultsAdminTab.tsx) so the two can't drift apart. */
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

/** Handles Appwrite returning team as hydrated Team object OR bare string $id */
export function teamName(player: Player): string {
  return typeof player.team === "string" ? player.team : player.team.name;
}

/** SVGs saved by signature.tsx lack viewBox, causing SvgXml to clip.
 *  Injects viewBox from width/height attrs so the content scales. */
export function injectViewBox(xml: string): string {
  if (xml.includes("viewBox")) { return xml; }
  return xml.replace(/<svg([^>]*)>/, (_, attrs: string) => {
    const w = attrs.match(/width="([^"]+)"/)?.[1];
    const h = attrs.match(/height="([^"]+)"/)?.[1];
    if (!w || !h) { return `<svg${attrs}>`; }
    return `<svg${attrs} viewBox="0 0 ${w} ${h}">`;
  });
}

/** Handles string, object, or array shapes Appwrite may return for relationship fields */
export function resolveGameId(ref: unknown): string | null {
  if (!ref) {return null;}
  if (typeof ref === "string") {return ref;}
  if (Array.isArray(ref)) {
    const first = ref[0];
    if (!first) {return null;}
    return typeof first === "string" ? first : (first as any).$id ?? null;
  }
  return (ref as any).$id ?? null;
}
