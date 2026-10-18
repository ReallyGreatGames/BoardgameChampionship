import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { router } from "expo-router";
import { useAuth } from "../auth";
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

function playerIdentity(player: Player): string | null {
  if (player.playerCode) {
    return player.playerCode;
  }

  const teamCode =
    typeof player.team === "object" && player.team ? player.team.code : null;
  return teamCode && Number.isInteger(player.playerNumber)
    ? `${teamCode}-${player.playerNumber}`
    : null;
}

export const PlayerProvider: FC<PropsWithChildren> = ({ children }) => {
  const { isAdmin } = useAuth();
  const [player, setPlayer] = useState<Player | null>(null);
  const [playerLoading, setPlayerLoading] = useState(true);
  const playerStoreCollection = usePlayerStore((s) => s.collection);

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

  useEffect(() => {
    if (playerStoreCollection.length === 0) {
      return;
    }
    if (!player) {
      return;
    }

    const stillSelected = playerStoreCollection.find((p) => p.$id === player.$id);
    if (stillSelected) {
      return;
    }

    if (isAdmin) {
      void Promise.resolve().then(() => {
        setPlayer(null);
        return SecureStorage.deleteItemAsync(PLAYER_INFO_KEY);
      });
      return;
    }

    const identity = playerIdentity(player);
    const replacement = identity
      ? playerStoreCollection.find((p) => playerIdentity(p) === identity)
      : undefined;

    if (replacement) {
      void Promise.resolve().then(() => {
        setPlayer(replacement);
        return SecureStorage.setItemAsync(
          PLAYER_INFO_KEY,
          JSON.stringify(replacement),
        );
      });
      return;
    }

    const missingPlayerTimeout = setTimeout(() => {
      setPlayer(null);
      void SecureStorage.deleteItemAsync(PLAYER_INFO_KEY);
      router.replace({
        pathname: "/(pages)/(team-player)/choose-your-character",
        params: { reason: "roster-changed" },
      });
    }, 1500);

    return () => clearTimeout(missingPlayerTimeout);
  }, [isAdmin, playerStoreCollection, player]);

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
