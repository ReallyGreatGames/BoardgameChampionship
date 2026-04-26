export const EMPTY = Symbol("empty");

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

/** Normalizes playerTimes — real-time payloads may serialize arrays as JSON strings */
export function toNumberArray(value: unknown): number[] {
  if (Array.isArray(value)) return value as number[];
  if (typeof value === "string") {
    try { return JSON.parse(value) as number[]; } catch { return []; }
  }
  return [];
}

/** Handles string, object, or array shapes Appwrite may return for relationship fields */
export function resolveGameId(ref: unknown): string | null {
  if (!ref) return null;
  if (typeof ref === "string") return ref;
  if (Array.isArray(ref)) {
    const first = ref[0];
    if (!first) return null;
    return typeof first === "string" ? first : (first as any).$id ?? null;
  }
  return (ref as any).$id ?? null;
}
