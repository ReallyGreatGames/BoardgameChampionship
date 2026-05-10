import { Table } from "@/lib/models/table";
import { Query } from "react-native-appwrite";
import { create } from "zustand";
import {
  initCollection,
  Key,
  RealtimeCollectionStore,
} from "../real-time-store";

interface TableState extends RealtimeCollectionStore<Table> {
  init: () => Promise<void>;
}

export const useTableStore = create<TableState>((set) => {
  let unsubscribe: (() => void) | null = null;
  const key: Key = "tables";

  return {
    collection: [],
    init: async () => {
      unsubscribe = await initCollection<Table>(key, set as any, unsubscribe, [
        Query.select(["*", "players.*", "players.team.*", "game.*"]),
      ]);
    },
  };
});
