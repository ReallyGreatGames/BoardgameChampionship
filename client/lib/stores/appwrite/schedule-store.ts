import { Schedule } from "@/lib/models/schedule";
import { Models } from "react-native-appwrite";
import { create } from "zustand";
import {
  addToCollection,
  initCollection,
  Key,
  RealtimeCollectionStore,
  removeFromCollection,
  updateInCollection
} from "../real-time-store";

export type PartialSchedule = Partial<Schedule> & { $id: string };

interface ScheduleState extends RealtimeCollectionStore<Schedule> {
  init: () => Promise<void>;
  add: (data: Omit<Schedule, keyof Models.Document>) => Promise<Schedule | null>;
  update: (item: PartialSchedule) => Promise<boolean>;
  delete: (data: PartialSchedule) => Promise<boolean>;
}

export const useScheduleStore = create<ScheduleState>((set) => {
  let unsubscribe: (() => void) | null = null;
  const key: Key = "schedule";

  return {
    collection: [],
    init: async () => {
      unsubscribe = await initCollection<Schedule, ScheduleState>(key, set, unsubscribe);
    },

    add: async (data: Omit<Schedule, keyof Models.Document>) =>
      await addToCollection(key, data),

    update: async (item: PartialSchedule) => await updateInCollection(key, item),

    delete: async (data: PartialSchedule) =>
      await removeFromCollection(key, data),
  };
});