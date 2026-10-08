import { Player } from "@/lib/models/player";
import { Query } from "react-native-appwrite";
import { create } from "zustand";
import { FetchOptions, fetchCollection, Key, RealtimeCollectionStore } from "../real-time-store";

interface PlayerState extends RealtimeCollectionStore<Player> {
  initialized: boolean;
  init: (options?: FetchOptions) => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set) => {
  const key: Key = "players";

  return {
    collection: [],
    key,
    realtimeSet: set as any,
    relationshipFields: ["team"],
    initialized: false,
    init: async (options) => {
      await fetchCollection<Player>(key, set as any, [
        Query.select(["*", "team.*"]),
      ], options);
      set((s) => ({ ...s, initialized: true }));
    },
  };
});
