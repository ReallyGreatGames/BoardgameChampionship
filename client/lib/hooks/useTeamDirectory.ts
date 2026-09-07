import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Team } from "@/lib/models/team";
import { useTeamStore } from "@/lib/stores/appwrite/team-store";

export type CountrySection = {
  country: string;
  label: string;
  data: Team[];
};

export type TeamDirectory = {
  sections: CountrySection[];
  count: number;
  search: string;
  setSearch: (value: string) => void;
  isLoading: boolean;
};

export function useTeamDirectory(): TeamDirectory {
  const { t } = useTranslation(["participants"]);
  const collection = useTeamStore((s) => s.collection);
  const initialized = useTeamStore((s) => s.initialized);
  const [search, setSearch] = useState("");

  const sections = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matches = collection.filter(
      (team) =>
        !query ||
        (team.code ?? "").toLowerCase().includes(query) ||
        (team.name ?? "").toLowerCase().includes(query) ||
        (team.country ?? "").toLowerCase().includes(query),
    );

    const byCountry = new Map<string, Team[]>();
    matches.forEach((team) => {
      const country = team.country || "?";
      const teams = byCountry.get(country) ?? [];
      teams.push(team);
      byCountry.set(country, teams);
    });

    return [...byCountry.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([country, teams]) => ({
        country,
        label: t("teamCount", { count: teams.length }),
        data: [...teams].sort(
          (a, b) =>
            (a.code ?? "").localeCompare(b.code ?? "") ||
            (a.name ?? "").localeCompare(b.name ?? ""),
        ),
      }));
  }, [collection, search, t]);

  const count = useMemo(
    () => sections.reduce((sum, section) => sum + section.data.length, 0),
    [sections],
  );

  return {
    sections,
    count,
    search,
    setSearch,
    isLoading: !initialized,
  };
}
