import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import { Schedule } from "../models/schedule";
import { inset } from "../theme/spacing";
import { type } from "../theme/typography";

interface Props {
  items: Schedule[];
}

export function UpcomingList({ items }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation(["home"]);

  const styles = useMemo(() => StyleSheet.create({
    list: {
      gap: inset.list,
    },
    row: {
      gap: 2,
    },
    titleFirst: {
      ...type.h3,
      color: colors.text,
    },
    title: {
      ...type.bodySmall,
      color: colors.textSecondary,
    },
    timeFirst: {
      ...type.bodySmall,
      color: colors.textMuted,
    },
    time: {
      ...type.caption,
      color: colors.textMuted,
    },
  }), [colors]);

  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <View key={item.$id} style={styles.row}>
          <Text style={index === 0 ? styles.titleFirst : styles.title}>
            {item.title}
          </Text>
          <Text style={index === 0 ? styles.timeFirst : styles.time}>
            {t("startsAt", { time: item.startTimePlanned })}
          </Text>
        </View>
      ))}
    </View>
  );
}
