import { Table } from "@/lib/models/table";
import { Query } from "react-native-appwrite";
import { create } from "zustand";
import {
  FetchOptions,
  fetchCollection,
  Key,
  RealtimeCollectionStore,
} from "../real-time-store";

interface TableState extends RealtimeCollectionStore<Table> {
  init: (options?: FetchOptions) => Promise<void>;
}

export const useTableStore = create<TableState>((set) => {
  const key: Key = "tables";

  return {
    collection: [],
    key,
    realtimeSet: set as any,
    relationshipFields: ["players", "game"],
    init: async (options) => {
      await fetchCollection<Table>(key, set as any, [
        Query.select(["*", "players.*", "players.team.*", "game.*"]),
      ], options);
    },
  };
});
