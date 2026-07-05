import { Game } from "@/lib/models/game";
import { Models } from "react-native-appwrite";
import { create } from "zustand";
import {
  addToCollection,
  fetchCollection,
  Key,
  RealtimeCollectionStore,
  updateInCollection,
} from "../real-time-store";

export type PartialGame = Partial<Game> & { $id: string };

/** @deprecated Use PartialGame */
export type PartialTimerSettings = PartialGame;

type GameInput = Omit<Game, keyof Models.Document | keyof Models.Row>;

interface TimerSettingsState extends RealtimeCollectionStore<Game> {
  init: () => Promise<void>;
  add: (data: GameInput) => Promise<Game | null>;
  update: (item: PartialGame, silent?: boolean) => Promise<boolean>;
}

export const useTimerSettingsStore = create<TimerSettingsState>((set) => {
  const key: Key = "games";

  return {
    collection: [],
    key,
    realtimeSet: set,
    init: async () => {
      await fetchCollection<Game, TimerSettingsState>(key, set);
    },

    add: async (data) => await addToCollection<Game>(key, data as Omit<Game, keyof Models.Document>),

    update: async (item, silent = false) => await updateInCollection(key, item, silent),
  };
});
