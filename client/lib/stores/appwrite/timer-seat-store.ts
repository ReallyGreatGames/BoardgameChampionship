import { TimerSeat, timerSeatRowId } from "@/lib/models/timer-seat";
import { Models } from "react-native-appwrite";
import { create } from "zustand";
import { resolveGameId } from "@/lib/utils";
import {
  addToCollection,
  fetchCollection,
  Key,
  RealtimeCollectionStore,
  updateInCollection,
} from "../real-time-store";

export type PartialTimerSeat = Partial<TimerSeat> & { $id: string };

interface TimerSeatState extends RealtimeCollectionStore<TimerSeat> {
  init: () => Promise<void>;
  add: (data: Omit<TimerSeat, keyof Models.Document>) => Promise<TimerSeat | null>;
  update: (item: PartialTimerSeat, silent?: boolean) => Promise<boolean>;
}

export const useTimerSeatStore = create<TimerSeatState>((set) => {
  const key: Key = "timer_seats";

  return {
    collection: [],
    key,
    realtimeSet: set,
    init: async () => {
      await fetchCollection<TimerSeat, TimerSeatState>(key, set);
    },

    add: async (data) =>
      await addToCollection(key, data, {
        rowId: timerSeatRowId(data.table, resolveGameId(data.games), data.seat),
        silentOnConflict: true,
      }),

    update: async (item, silent = false) =>
      await updateInCollection(key, item, silent),
  };
});
