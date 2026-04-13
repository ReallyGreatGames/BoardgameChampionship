import { useQuery } from "@tanstack/react-query";
import { createContext, FC, PropsWithChildren, useContext } from "react";
import { tablesDB } from "../appwrite";
import { Query } from "react-native-appwrite";
import { EMPTY } from "../empty";
import { useTranslation } from "react-i18next";

export type Tournament = {
  locale: "en" | "de";
  active: boolean;
};

export const tournamentContext = createContext<Tournament>({
  locale: "en",
  active: true,
});

export const TournamentProvider: FC<PropsWithChildren> = ({ children }) => {
  const { i18n } = useTranslation();
  const query = useQuery<typeof EMPTY | Tournament>({
    queryKey: ["tournament"],
    initialData: EMPTY,
    refetchInterval: 60 * 60 * 1_000, // hourly
    queryFn: async () => {
      const res = await tablesDB.listRows({
        databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
        tableId: "tournament",
        queries: [
          Query.equal("active", true),
          Query.orderDesc("$createdAt"),
          Query.limit(1),
        ],
      });

      if (res.total === 0) {
        return EMPTY;
      }

      const data = res.rows[0]!;
      const activeTournament: Tournament = {
        active: true,
        locale: data.locale,
      };

      i18n.changeLanguage(activeTournament.locale);

      return activeTournament;
    },
  });

  return (
    <tournamentContext.Provider
      value={
        query.data === EMPTY ? { active: true, locale: "en" } : query.data
      }
    >
      {children}
    </tournamentContext.Provider>
  );
};

export const useTournament = () => {
  return useContext(tournamentContext);
};
