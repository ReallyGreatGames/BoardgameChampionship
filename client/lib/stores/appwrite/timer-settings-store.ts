import { TimerSettings } from "@/lib/models/timer-settings";
import { Models } from "react-native-appwrite";
import { create } from "zustand";
import {
  addToCollection,
  initCollection,
  Key,
  RealtimeCollectionStore,
  updateInCollection,
} from "../real-time-store";

export type PartialTimerSettings = Partial<TimerSettings> & { $id: string };

interface TimerSettingsState extends RealtimeCollectionStore<TimerSettings> {
  init: () => Promise<void>;
  add: (data: Omit<TimerSettings, keyof Models.Document>) => Promise<TimerSettings | null>;
  update: (item: PartialTimerSettings, silent?: boolean) => Promise<boolean>;
}

export const useTimerSettingsStore = create<TimerSettingsState>((set) => {
  let unsubscribe: (() => void) | null = null;
  const key: Key = "games";

  return {
    collection: [],
    init: async () => {
      unsubscribe = await initCollection<TimerSettings, TimerSettingsState>(key, set, unsubscribe);
    },

    add: async (data) => await addToCollection(key, data),

    update: async (item, silent = false) => await updateInCollection(key, item, silent),
  };
});
