import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { StatRow } from "@/lib/components/statistics/StatRow";

type Props = {
  placementRates: (number | null)[];
  placementCounts: number[];
  matches: number;
  sliceColor: (index: number) => string;
};

function formatPercent(value: number | null): string {
  return value === null ? "–" : `${Math.round(value * 100)}%`;
}

export function PlacementLegend({ placementRates, placementCounts, matches, sliceColor }: Props) {
  const { t } = useTranslation(["statistics"]);

  return (
    <View style={styles.column}>
      {placementRates.map((rate, i) => (
        <StatRow
          key={i}
          label={t("placeShort", { n: i + 1 })}
          value={formatPercent(rate)}
          sub={matches > 0 ? `(${placementCounts[i]}/${matches})` : undefined}
          swatchColor={sliceColor(i)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    gap: 4,
  },
});
