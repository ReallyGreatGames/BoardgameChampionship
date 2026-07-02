import { Player } from "@/lib/models/player";
import { Query } from "react-native-appwrite";
import { create } from "zustand";
import { initCollection, Key, RealtimeCollectionStore } from "../real-time-store";

interface PlayerState extends RealtimeCollectionStore<Player> {
  initialized: boolean;
  init: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set) => {
  let unsubscribe: (() => void) | null = null;
  const key: Key = "players";

  return {
    collection: [],
    initialized: false,
    init: async () => {
      unsubscribe = await initCollection<Player>(key, set as any, unsubscribe, [
        Query.select(["*", "team.*"]),
      ]);
      set((s) => ({ ...s, initialized: true }));
    },
  };
});
