import { useAuth } from "@/lib/auth";
import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
} from "@react-navigation/drawer";
import { router, usePathname } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

function DrawerHeader() {
  const { t } = useTranslation(["menu"]);

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{t("title")}</Text>
      <Pressable
        onPress={() => {
          router.push("/(pages)/info");
        }}
        hitSlop={12}
      >
        <Ionicons name="information-circle-outline" size={22} color="#fff" />
      </Pressable>
    </View>
  );
}

function DrawerFooter() {
  const { user, logout } = useAuth();

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
          <Ionicons name="settings-outline" size={22} color="#fff" />
        </Pressable>
        <Pressable style={styles.iconButton} onPress={handleAuthPress}>
          <Ionicons
            name={user ? "log-out-outline" : "log-in-outline"}
            size={22}
            color="#fff"
          />
        </Pressable>
      </View>
    </View>
  );
}

export const drawerScreenOptions = {
  headerStyle: { backgroundColor: "#0f0f0f" },
  headerTintColor: "#fff",
  headerTitleStyle: { fontWeight: "700" as const },
  headerShadowVisible: false,
  headerShown: true,
  drawerStyle: { backgroundColor: "#0f0f0f" },
  drawerActiveTintColor: "#fff",
  drawerInactiveTintColor: "#888",
} as const;

export function AppDrawer(props: DrawerContentComponentProps) {
  const pathname = usePathname();
  const { t } = useTranslation(["menu"]);
  const { isAdmin, isPinVerified } = useAuth();

  const entries = [
    {
      translationId: "entries.home",
      route: "/",
      icon: "home-outline",
      scope: "private",
    },
    {
      translationId: "entries.dashboard",
      route: "/admin",
      icon: "grid-outline",
      scope: "admin",
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
        .map((entry, i) => {
          return (
            <DrawerItem
              key={i}
              label={t(entry.translationId)}
              focused={pathname === entry.route}
              onPress={() => router.push(entry.route as any)}
              activeTintColor="#fff"
              inactiveTintColor="#888"
              labelStyle={{ color: "#fff" }}
              icon={({ color, size }) => (
                <Ionicons name={entry.icon as any} size={size} color={color} />
              )}
            />
          );
        })}

      <View style={styles.spacer} />
      <DrawerFooter />
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#0f0f0f",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e1e",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  spacer: {
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#1e1e1e",
    padding: 16,
    gap: 12,
  },
  footerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#1a1a1a",
  },
});
