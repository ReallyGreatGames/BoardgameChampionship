import { OptionsLotteryRow } from "@/lib/models/options-lottery";
import { Models } from "react-native-appwrite";
import { create } from "zustand";
import {
  addToCollection,
  fetchCollection,
  Key,
  RealtimeCollectionStore,
  removeFromCollection,
  updateInCollection,
} from "../real-time-store";

export type PartialOptionsLotteryRow = Partial<OptionsLotteryRow> & { $id: string };

interface OptionsLotteryState extends RealtimeCollectionStore<OptionsLotteryRow> {
  init: () => Promise<void>;
  add: (
    data: Omit<OptionsLotteryRow, keyof Models.Document>,
  ) => Promise<OptionsLotteryRow | null>;
  update: (item: PartialOptionsLotteryRow) => Promise<boolean>;
  delete: (data: PartialOptionsLotteryRow) => Promise<boolean>;
}

export const useOptionsLotteryStore = create<OptionsLotteryState>((set) => {
  const key: Key = "options-lotteries";

  return {
    collection: [],
    key,
    realtimeSet: set,
    init: async () => {
      await fetchCollection<OptionsLotteryRow, OptionsLotteryState>(key, set);
    },

    add: async (data: Omit<OptionsLotteryRow, keyof Models.Document>) =>
      await addToCollection(key, data),

    update: async (item: PartialOptionsLotteryRow) => await updateInCollection(key, item),

    delete: async (data: PartialOptionsLotteryRow) => await removeFromCollection(key, data),
  };
});
