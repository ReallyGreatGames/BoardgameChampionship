import { useCallback, useEffect, useState } from "react";
import { getItemAsync, setItemAsync } from "@/lib/secureStorage";

/**
 * Reads/writes a per-game, per-device preference under
 * `${keyPrefix}_${gameId}` in secureStorage — read once on mount/gameId
 * change, written through on every change. Shared by every setting that
 * follows this exact shape (player colors, timer orientation/pause mode)
 * so the read/write/key pattern lives in one place instead of being
 * re-implemented per setting.
 *
 * `parse` should be a stable (module-level) function reference — it's a
 * dependency of the load effect, so an inline lambda would re-run the load
 * on every render.
 */
export function useSecureStoragePerGame<T>(
  keyPrefix: string,
  gameId: string | undefined,
  defaultValue: T,
  parse: (raw: string) => T | null,
): [T, (next: T) => void] {
  const [value, setValueState] = useState<T>(defaultValue);

  useEffect(() => {
    if (!gameId) {
      setValueState(defaultValue);
      return;
    }
    getItemAsync(`${keyPrefix}_${gameId}`).then((raw) => {
      if (raw == null) {
        setValueState(defaultValue);
        return;
      }
      const parsed = parse(raw);
      setValueState(parsed ?? defaultValue);
    });
  }, [gameId, keyPrefix, defaultValue, parse]);

  const setValue = useCallback(
    (next: T) => {
      setValueState(next);
      if (gameId) {
        setItemAsync(`${keyPrefix}_${gameId}`, typeof next === "string" ? next : JSON.stringify(next));
      }
    },
    [gameId, keyPrefix],
  );

  return [value, setValue];
}
