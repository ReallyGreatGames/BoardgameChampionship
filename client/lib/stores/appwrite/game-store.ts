import { Game } from "@/lib/models/game";
import { create } from "zustand";
import {
  initCollection,
  Key,
  RealtimeCollectionStore,
} from "../real-time-store";

interface GameState extends RealtimeCollectionStore<Game> {
  init: () => Promise<void>;
}

export const useGameStore = create<GameState>((set) => {
  let unsubscribe: (() => void) | null = null;
  const key: Key = "games";

  return {
    collection: [],
    init: async () => {
      unsubscribe = await initCollection<Game, GameState>(key, set, unsubscribe);
    },
  };
});
