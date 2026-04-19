import { TableBell } from "@/lib/models/table-bell";
import { Models } from "react-native-appwrite";
import { create } from "zustand";
import {
  addToCollection,
  initCollection,
  Key,
  RealtimeCollectionStore,
  removeFromCollection,
  updateInCollection,
} from "../real-time-store";

export type PartialTableBell = Partial<TableBell> & { $id: string };

interface TableBellState extends RealtimeCollectionStore<TableBell> {
  init: () => Promise<void>;
  add: (data: Omit<TableBell, keyof Models.Document>) => Promise<TableBell | null>;
  update: (item: PartialTableBell) => Promise<boolean>;
  delete: (data: PartialTableBell) => Promise<boolean>;
}

export const useTableBellStore = create<TableBellState>((set) => {
  let unsubscribe: (() => void) | null = null;
  const key: Key = "table-bell";

  return {
    collection: [],
    init: async () => {
      unsubscribe = await initCollection<TableBell, TableBellState>(key, set, unsubscribe);
    },

    add: async (data: Omit<TableBell, keyof Models.Document>) =>
      await addToCollection(key, data),

    update: async (item: PartialTableBell) => await updateInCollection(key, item),

    delete: async (data: PartialTableBell) => await removeFromCollection(key, data),
  };
});
