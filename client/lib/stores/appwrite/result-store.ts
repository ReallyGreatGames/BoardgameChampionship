import { Result } from "@/lib/models/result";
import { Models } from "react-native-appwrite";
import { create } from "zustand";
import {
  addToCollection,
  initCollection,
  Key,
  RealtimeCollectionStore,
  updateInCollection,
} from "../real-time-store";

export type PartialResult = Partial<Result> & { $id: string };

interface ResultState extends RealtimeCollectionStore<Result> {
  init: () => Promise<void>;
  add: (data: Omit<Result, keyof Models.Document>) => Promise<Result | null>;
  update: (item: PartialResult, silent?: boolean) => Promise<boolean>;
}

export const useResultStore = create<ResultState>((set) => {
  let unsubscribe: (() => void) | null = null;
  const key: Key = "results";

  return {
    collection: [],
    init: async () => {
      unsubscribe = await initCollection<Result, ResultState>(key, set, unsubscribe);
    },

    add: async (data) => await addToCollection(key, data),

    update: async (item, silent = false) => await updateInCollection(key, item, silent),
  };
});
