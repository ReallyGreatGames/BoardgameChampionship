import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { Table } from "@/lib/components/Table";
import { inset } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ActionButton = {
  key: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  labelKey: string;
};

const ACTION_BUTTONS: ActionButton[] = [
  { key: "lottery",   icon: "shuffle",               labelKey: "actions.lottery"   },
  { key: "rules",     icon: "book-outline",           labelKey: "actions.rules"     },
  { key: "tableBell", icon: "notifications-outline",  labelKey: "actions.tableBell" },
  { key: "timer",     icon: "timer-outline",          labelKey: "actions.timer"     },
  { key: "results",   icon: "trophy-outline",         labelKey: "actions.results"   },
];

export default function GamePage() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["game"]);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/(pages)/login");
  }, [user, loading]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(pages)/(user)/schedule");
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handleBack} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={18} color={colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.title}>{t("title")}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <Table gameId={gameId} />

        <View style={styles.actionsGrid}>
          {ACTION_BUTTONS.map(({ key, icon, labelKey }) => (
            <TouchableOpacity key={key} style={styles.actionBtn} activeOpacity={0.7}>
              <Ionicons name={icon} size={28} color={colors.primary} />
              <Text style={styles.actionLabel}>{t(labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 24,
      paddingTop: 32,
    },
    backBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginBottom: inset.group,
    },
    backText: {
      ...type.bodySmall,
      color: colors.primary,
    },
    header: {
      marginBottom: inset.group,
    },
    title: {
      ...type.h1,
      color: colors.text,
    },
    list: {
      paddingBottom: inset.screenBottom,
      gap: inset.group,
    },
    actionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: inset.list,
    },
    actionBtn: {
      width: "47%",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: inset.card,
      alignItems: "center",
      gap: 8,
    },
    actionLabel: {
      ...type.bodySmall,
      color: colors.text,
      fontWeight: "600",
    },
  });
}
