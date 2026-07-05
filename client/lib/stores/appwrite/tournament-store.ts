import { Tournament } from "@/lib/models/tournament";
import { create } from "zustand";
import { initCollection, Key, RealtimeCollectionStore } from "../real-time-store";

interface TournamentState extends RealtimeCollectionStore<Tournament> {
  initialized: boolean;
  init: () => Promise<void>;
}

export const useTournamentStore = create<TournamentState>((set) => {
  let unsubscribe: (() => void) | null = null;
  const key: Key = "tournament";

  return {
    collection: [],
    initialized: false,
    init: async () => {
      unsubscribe = await initCollection<Tournament>(key, set as any, unsubscribe);
      set((s) => ({ ...s, initialized: true }));
    },
  };
});
