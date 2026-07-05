import { Timer } from "@/lib/models/timer";
import { Models, Query } from "react-native-appwrite";
import { create } from "zustand";
import {
  addToCollection,
  fetchCollection,
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
  const key: Key = "timers";

  return {
    collection: [],
    key,
    realtimeSet: set,
    init: async () => {
      await fetchCollection<Timer, TimerState>(
        key,
        set,
        [Query.select(["*", "playerPositions.*"])],
      );
    },

    add: async (data) => await addToCollection(key, data),

    update: async (item, silent = false) =>
      await updateInCollection(key, item, silent),
  };
});
