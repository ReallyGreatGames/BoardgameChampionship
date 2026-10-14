import { useEffect } from "react";
import { useFeatureFlagStore } from "../stores/appwrite/feature-flag-store";
import { useRuleStore } from "../stores/appwrite/rule-store";
import { useScheduleStore } from "../stores/appwrite/schedule-store";
import { useTableBellStore } from "../stores/appwrite/table-bell-store";
import { useTableStore } from "../stores/appwrite/table-store";
import { useTimerSeatStore } from "../stores/appwrite/timer-seat-store";
import { useTimerSettingsStore } from "../stores/appwrite/timer-settings-store";
import { useTimerStore } from "../stores/appwrite/timer-store";
import { useTournamentStore } from "../stores/appwrite/tournament-store";
import {
  loadCachedCollection,
  saveCachedCollection,
} from "../cache/collection-cache";

type CacheTarget = {
  store: any;
  sanitize?: (row: any) => any;
};

const CACHE_TARGETS: CacheTarget[] = [
  {
    store: useTournamentStore,
    sanitize: ({ pin, ...rest }: any) => rest,
  },
  { store: useFeatureFlagStore },
  { store: useScheduleStore },
  { store: useTableStore },
  { store: useRuleStore },
  { store: useTimerStore },
  { store: useTimerSeatStore },
  { store: useTimerSettingsStore },
  { store: useTableBellStore },
];

const PERSIST_DEBOUNCE_MS = 400;

const serialize = (target: CacheTarget, collection: any[]) =>
  target.sanitize ? collection.map(target.sanitize) : collection;

export function CacheProvider() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      for (const target of CACHE_TARGETS) {
        const { key } = target.store.getState();
        const cached = await loadCachedCollection(key);
        if (cancelled || !cached) {
          continue;
        }
        if (target.store.getState().collection.length === 0) {
          console.debug(`[cache] hydrated ${key} from disk`, cached.length);
          target.store.getState().realtimeSet({ collection: cached });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timers = new Map<string, ReturnType<typeof setTimeout>>();

    const unsubscribes = CACHE_TARGETS.map((target) => {
      const { key } = target.store.getState();
      return target.store.subscribe((state: any, prevState: any) => {
        if (state.collection === prevState.collection) {
          return;
        }
        const existing = timers.get(key);
        if (existing) {
          clearTimeout(existing);
        }
        timers.set(
          key,
          setTimeout(() => {
            timers.delete(key);
            saveCachedCollection(key, serialize(target, state.collection));
          }, PERSIST_DEBOUNCE_MS),
        );
      });
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return null;
}
