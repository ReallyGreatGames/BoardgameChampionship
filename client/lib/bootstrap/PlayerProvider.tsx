import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePlayerStore } from "../stores/appwrite/player-store";
import * as SecureStorage from "../secureStorage";
import { Player } from "../models/player";

export type Team = {
  name: string;
  code: string;
  country: string;
};

export type PlayerContext = {
  player: Player | null;
  playerLoading: boolean;
  assignPlayer: (player: Player) => Promise<void>;
  clearPlayer: () => Promise<void>;
};

export const PLAYER_INFO_KEY = "player_info";

export const playerContext = createContext<PlayerContext>({
  assignPlayer: () => Promise.resolve(),
  clearPlayer: () => Promise.resolve(),
  player: null,
  playerLoading: true,
});

export const PlayerProvider: FC<PropsWithChildren> = ({ children }) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [playerLoading, setPlayerLoading] = useState(true);
  const playerStoreCollection = usePlayerStore((s) => s.collection);
  const storeWasEmpty = useRef(true);

  useEffect(() => {
    (async () => {
      const raw = await SecureStorage.getItemAsync(PLAYER_INFO_KEY);
      if (!raw) {
        setPlayer(null);
      } else {
        const parsed = JSON.parse(raw);
        if (typeof parsed.$id !== "string") {
          await SecureStorage.deleteItemAsync(PLAYER_INFO_KEY);
          setPlayer(null);
        } else {
          setPlayer(parsed as Player);
        }
      }
      setPlayerLoading(false);
    })();
  }, []);

  // Validate stored player against the player store once it first loads.
  // Only triggers on the empty→populated transition; skips mid-session updates.
  useEffect(() => {
    if (playerStoreCollection.length === 0) {
      storeWasEmpty.current = true;
      return;
    }
    if (!storeWasEmpty.current) return;
    storeWasEmpty.current = false;
    if (!player) return;

    const valid = playerStoreCollection.some((p) => p.$id === player.$id);
    if (!valid) {
      setPlayer(null);
      SecureStorage.deleteItemAsync(PLAYER_INFO_KEY);
    }
  }, [playerStoreCollection, player]);

  const assignPlayer = async (p: Player) => {
    setPlayer(p);
    await SecureStorage.setItemAsync(PLAYER_INFO_KEY, JSON.stringify(p));
  };

  const clearPlayer = async () => {
    setPlayer(null);
    await SecureStorage.deleteItemAsync(PLAYER_INFO_KEY);
  };

  return (
    <playerContext.Provider value={{ player, playerLoading, assignPlayer, clearPlayer }}>
      {children}
    </playerContext.Provider>
  );
};

export const usePlayer = () => {
  return useContext(playerContext);
};
