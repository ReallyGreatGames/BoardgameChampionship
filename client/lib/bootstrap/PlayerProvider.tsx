import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import * as SecureStorage from "../secureStorage";

export type Team = {
  name: string;
  code: string;
  country: string;
};

export type Player = {
  team: Team;
  playerId: string;
};

export type PlayerContext = {
  player: Player | null;
  assignPlayer: (player: Player) => void;
};

export const PLAYER_INFO_KEY = "player_info";

export const playerContext = createContext<PlayerContext>({
  assignPlayer: () => void 0,
  player: null,
});

export const PlayerProvider: FC<PropsWithChildren> = ({ children }) => {
  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => {
    (async () => {
      const raw = await SecureStorage.getItemAsync(PLAYER_INFO_KEY);
      if (!raw) {
        setPlayer(null);
        return;
      }

      const player: Player = JSON.parse(raw);
      setPlayer(player);
    })();
  }, []);

  const assignPlayer = async (player: Player) => {
    setPlayer(player);
    await SecureStorage.setItemAsync(PLAYER_INFO_KEY, JSON.stringify(player));
  };

  return (
    <playerContext.Provider value={{ player, assignPlayer }}>
      {children}
    </playerContext.Provider>
  );
};

export const usePlayer = () => {
  return useContext(playerContext);
};
