import { Timer } from "@/lib/models/timer";
import { Models } from "react-native-appwrite";
import { create } from "zustand";
import {
  addToCollection,
  initCollection,
  Key,
  RealtimeCollectionStore,
  updateInCollection,
} from "../real-time-store";

export type PartialTimer = Partial<Timer> & { $id: string };

interface TimerState extends RealtimeCollectionStore<Timer> {
  init: () => Promise<void>;
  add: (data: Omit<Timer, keyof Models.Document>) => Promise<Timer | null>;
  update: (item: PartialTimer, silent?: boolean) => Promise<boolean>;
}

export const useTimerStore = create<TimerState>((set) => {
  let unsubscribe: (() => void) | null = null;
  const key: Key = "timers";

  return {
    collection: [],
    init: async () => {
      unsubscribe = await initCollection<Timer, TimerState>(key, set, unsubscribe);
    },

    add: async (data) => await addToCollection(key, data),

    update: async (item, silent = false) => await updateInCollection(key, item, silent),
  };
});
