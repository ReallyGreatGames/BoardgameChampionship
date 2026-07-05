import { Tournament } from "@/lib/models/tournament";
import { create } from "zustand";
import { fetchCollection, Key, RealtimeCollectionStore } from "../real-time-store";

interface TournamentState extends RealtimeCollectionStore<Tournament> {
  initialized: boolean;
  init: () => Promise<void>;
}

export const useTournamentStore = create<TournamentState>((set) => {
  const key: Key = "tournament";

  return {
    collection: [],
    key,
    realtimeSet: set as any,
    initialized: false,
    init: async () => {
      await fetchCollection<Tournament>(key, set as any);
      set((s) => ({ ...s, initialized: true }));
    },
  };
});
