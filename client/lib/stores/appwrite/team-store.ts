import { Team } from "@/lib/models/team";
import { create } from "zustand";
import { initCollection, Key, RealtimeCollectionStore } from "../real-time-store";

interface TeamState extends RealtimeCollectionStore<Team> {
  initialized: boolean;
  init: () => Promise<void>;
}

export const useTeamStore = create<TeamState>((set) => {
  let unsubscribe: (() => void) | null = null;
  const key: Key = "teams";

  return {
    collection: [],
    initialized: false,
    init: async () => {
      unsubscribe = await initCollection<Team>(key, set as any, unsubscribe);
      set((s) => ({ ...s, initialized: true }));
    },
  };
});
