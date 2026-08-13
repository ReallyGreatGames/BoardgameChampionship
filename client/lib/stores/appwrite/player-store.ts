import { Player } from "@/lib/models/player";
import { Query } from "react-native-appwrite";
import { create } from "zustand";
import { fetchCollection, Key, RealtimeCollectionStore } from "../real-time-store";

interface PlayerState extends RealtimeCollectionStore<Player> {
  initialized: boolean;
  init: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set) => {
  const key: Key = "players";

  return {
    collection: [],
    key,
    realtimeSet: set as any,
    // `team` is a to-one relationship — Appwrite's realtime payload can omit
    // it (coming back null) on an update that didn't touch it; see
    // real-time-store.ts's updateRealtimeCollectionUpdate for why this list
    // exists and must stay scoped to genuine relationship attributes only.
    relationshipFields: ["team"],
    initialized: false,
    init: async () => {
      await fetchCollection<Player>(key, set as any, [
        Query.select(["*", "team.*"]),
      ]);
      set((s) => ({ ...s, initialized: true }));
    },
  };
});
