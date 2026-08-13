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
    // `players` (to-many) and `game` (to-one) are relationships — Appwrite's
    // realtime payload can omit either on an update that didn't touch it;
    // see real-time-store.ts's updateRealtimeCollectionUpdate for why this
    // list exists and must stay scoped to genuine relationship attributes.
    relationshipFields: ["players", "game"],
    init: async () => {
      await fetchCollection<Table>(key, set as any, [
        Query.select(["*", "players.*", "players.team.*", "game.*"]),
      ]);
    },
  };
});
