import { Table } from "@/lib/models/table";
import { Query } from "react-native-appwrite";
import { create } from "zustand";
import {
  fetchCollection,
  Key,
  RealtimeCollectionStore,
} from "../real-time-store";

interface TableState extends RealtimeCollectionStore<Table> {
  init: () => Promise<void>;
}

export const useTableStore = create<TableState>((set) => {
  const key: Key = "tables";

  return {
    collection: [],
    key,
    realtimeSet: set as any,
    init: async () => {
      await fetchCollection<Table>(key, set as any, [
        Query.select(["*", "players.*", "players.team.*", "game.*"]),
      ]);
    },
  };
});
