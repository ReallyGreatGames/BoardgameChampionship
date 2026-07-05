import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useTranslation } from "react-i18next";
import { useTournamentStore } from "../stores/appwrite/tournament-store";

export type ActiveTournamentInfo = {
  locale: "en" | "de";
  active: boolean;
  type: "dmmib" | "europemasters";
};

const DEFAULT_TOURNAMENT_INFO: ActiveTournamentInfo = {
  locale: "en",
  active: false,
  type: "dmmib",
};

export const tournamentContext = createContext<ActiveTournamentInfo>(
  DEFAULT_TOURNAMENT_INFO,
);

export const TournamentProvider: FC<PropsWithChildren> = ({ children }) => {
  const { i18n } = useTranslation();
  const collection = useTournamentStore((s) => s.collection);

  const info = useMemo<ActiveTournamentInfo>(() => {
    const activeRow = collection.find((t) => t.active);
    if (!activeRow) {
      return DEFAULT_TOURNAMENT_INFO;
    }
    return { active: true, locale: activeRow.locale, type: activeRow.type };
  }, [collection]);

  useEffect(() => {
    if (info.active) {
      i18n.changeLanguage(info.locale);
    }
  }, [info.active, info.locale, i18n]);

  return (
    <tournamentContext.Provider value={info}>
      {children}
    </tournamentContext.Provider>
  );
};

export const useTournament = () => {
  return useContext(tournamentContext);
};
