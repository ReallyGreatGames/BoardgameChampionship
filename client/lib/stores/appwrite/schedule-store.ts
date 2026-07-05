import { Schedule } from "@/lib/models/schedule";
import { Models } from "react-native-appwrite";
import { create } from "zustand";
import {
  addToCollection,
  fetchCollection,
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
  const key: Key = "schedule";

  return {
    collection: [],
    key,
    realtimeSet: set,
    init: async () => {
      await fetchCollection<Schedule, ScheduleState>(key, set);
    },

    add: async (data: Omit<Schedule, keyof Models.Document>) =>
      await addToCollection(key, data),

    update: async (item: PartialSchedule) => await updateInCollection(key, item),

    delete: async (data: PartialSchedule) =>
      await removeFromCollection(key, data),
  };
});
