import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { useTableBellStore } from "@/lib/stores/appwrite/table-bell-store";
import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
} from "@react-navigation/drawer";
import { router, usePathname } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { inset } from "../theme/spacing";
import { type } from "../theme/typography";

function DrawerHeader() {
  const { t } = useTranslation(["menu"]);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{t("title")}</Text>
      <Pressable
        onPress={() => {
          router.push("/(pages)/info");
        }}
        hitSlop={12}
      >
        <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
      </Pressable>
    </View>
  );
}

function DrawerFooter() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  async function handleAuthPress() {
    if (user) {
      await logout();
      router.replace("/(pages)/login");
    } else {
      router.push("/(pages)/login");
    }
  }

  return (
    <View style={styles.footer}>
      <View style={styles.footerActions}>
        <Pressable
          style={styles.iconButton}
          onPress={() => router.push("/(pages)/settings")}
          hitSlop={8}
        >
          <Ionicons name="settings-outline" size={22} color={colors.primary} />
        </Pressable>
        <Pressable style={styles.iconButton} onPress={handleAuthPress}>
          <Ionicons
            name={user ? "log-out-outline" : "log-in-outline"}
            size={22}
            color={colors.primary}
          />
        </Pressable>
      </View>
    </View>
  );
}


export function AppDrawer(props: DrawerContentComponentProps) {
  const pathname = usePathname();
  const { t } = useTranslation(["menu"]);
  const { isAdmin, isPinVerified } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const bellCollection = useTableBellStore((s) => s.collection);
  const activeBellCount = useMemo(
    () => bellCollection.filter((b) => !b.acknowledgeTime).length,
    [bellCollection],
  );

  const entries = [
    {
      translationId: "entries.home",
      route: "/",
      icon: "home-outline",
      scope: "public",
      badgeCount: undefined as number | undefined,
    },
    {
      translationId: "entries.schedule",
      route: "/schedule",
      icon: "list-outline",
      scope: "private",
      badgeCount: undefined as number | undefined,
    },
    {
      translationId: "entries.activeBells",
      route: "/active-bells",
      icon: "notifications-outline",
      scope: "admin",
      badgeCount: isAdmin ? activeBellCount : undefined,
    },
    {
      translationId: "entries.dashboard",
      route: "/admin",
      icon: "grid-outline",
      scope: "admin",
      badgeCount: undefined as number | undefined,
    },
  ];

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.container}
    >
      <DrawerHeader />

      {entries
        .filter((entry) => {
          if (entry.scope === "public") return true;
          if (entry.scope === "private" && (isPinVerified || isAdmin))
            return true;
          if (entry.scope === "admin" && isAdmin) return true;
          return false;
        })
        .map((entry, i) => (
          <DrawerItem
            key={i}
            label={entry.badgeCount !== undefined
              ? () => (
                <View style={styles.labelRow}>
                  <Text style={[styles.labelText, { color: colors.text }]}>
                    {t(entry.translationId)}
                  </Text>
                  {entry.badgeCount! > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{entry.badgeCount}</Text>
                    </View>
                  )}
                </View>
              )
              : () => (<Text style={[styles.labelText, { color: colors.text }]}>
                {t(entry.translationId)}
              </Text>)
            }
            focused={pathname === entry.route}
            onPress={() => router.push(entry.route as any)}
            activeTintColor={colors.primary}
            inactiveTintColor={colors.textMuted}
            labelStyle={{ color: colors.text }}
            icon={({ color, size }) => (
              <Ionicons name={entry.icon as any} size={size} color={color} />
            )}
          />
        ))}

      <View style={styles.spacer} />
      <DrawerFooter />
    </DrawerContentScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: inset.card,
      paddingTop: inset.card,
      paddingBottom: inset.group,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      marginBottom: inset.tight,
    },
    headerTitle: {
      ...type.h3,
      color: colors.text,
    },
    spacer: {
      flex: 1,
    },
    footer: {
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      padding: inset.card,
    },
    footerActions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    iconButton: {
      padding: 6,
      borderRadius: 8,
      backgroundColor: colors.surface,
    },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    labelText: {
      ...type.bodySmall,
      color: colors.text,
      flex: 1,
    },
    badge: {
      backgroundColor: colors.accent,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 5,
    },
    badgeText: {
      ...type.eyebrow,
      color: "#fff",
      letterSpacing: 0,
    },
  });
}
