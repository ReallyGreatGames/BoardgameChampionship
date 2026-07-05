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
    initialized: false,
    init: async () => {
      await fetchCollection<Player>(key, set as any, [
        Query.select(["*", "team.*"]),
      ]);
      set((s) => ({ ...s, initialized: true }));
    },
  };
});
