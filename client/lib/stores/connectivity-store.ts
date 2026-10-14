import { create } from "zustand";

type ConnectivityState = {
  isOnline: boolean | null;
  timerActive: boolean;
  setOnline: (online: boolean) => void;
  setTimerActive: (active: boolean) => void;
};

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  isOnline: null,
  timerActive: false,
  setOnline: (online) => set({ isOnline: online }),
  setTimerActive: (timerActive) => set({ timerActive }),
}));
