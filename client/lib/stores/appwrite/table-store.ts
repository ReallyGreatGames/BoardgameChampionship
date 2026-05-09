import { Table } from "@/lib/models/table";
import { Query } from "react-native-appwrite";
import { create } from "zustand";
import { initCollection, Key } from "../real-time-store";

interface TableState {
  collection: Table[];
  init: () => Promise<void>;
}

export const useTableStore = create<TableState>((set) => {
  let unsubscribe: (() => void) | null = null;
  const key: Key = "tables";

  return {
    collection: [],
    init: async () => {
      unsubscribe = await initCollection<Table>(key, set as any, unsubscribe, [
        Query.select(["*", "players.*"]),
      ]);
    },
  };
});
