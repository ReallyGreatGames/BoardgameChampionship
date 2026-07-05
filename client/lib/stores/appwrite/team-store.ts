import { Team } from "@/lib/models/team";
import { create } from "zustand";
import { fetchCollection, Key, RealtimeCollectionStore } from "../real-time-store";

interface TeamState extends RealtimeCollectionStore<Team> {
  initialized: boolean;
  init: () => Promise<void>;
}

export const useTeamStore = create<TeamState>((set) => {
  const key: Key = "teams";

  return {
    collection: [],
    key,
    realtimeSet: set as any,
    initialized: false,
    init: async () => {
      await fetchCollection<Team>(key, set as any);
      set((s) => ({ ...s, initialized: true }));
    },
  };
});
