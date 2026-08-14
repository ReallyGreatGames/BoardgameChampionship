import { useCallback, useEffect, useState } from "react";
import { getItemAsync, setItemAsync } from "@/lib/secureStorage";

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
