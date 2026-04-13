import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

function DrawerHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Boardgame Championship</Text>
      <Pressable onPress={() => { }} hitSlop={12}>
        <Ionicons name="information-circle-outline" size={22} color="#fff" />
      </Pressable>
    </View>
  );
}

function DrawerFooter() {

  return (
    <View style={styles.footer}>
      <View style={styles.footerActions}>
        <Pressable
          style={styles.iconButton}
          onPress={() => router.push("/settings")}
          hitSlop={8}
        >
          <Ionicons name="settings-outline" size={22} color="#fff" />
        </Pressable>
        <Pressable
          style={styles.iconButton}
          onPress={() => router.push("/(pages)/login")}
        >
          <Ionicons name="log-in-outline" size={22} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

export function AppDrawer(props: DrawerContentComponentProps) {
  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.container}
    >
      <DrawerHeader />
      <DrawerItemList {...props} />
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
  // Header
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
  headerSubtitle: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  // Spacer
  spacer: {
    flex: 1,
  },
  // Footer – collapsed
  footerCollapsed: {
    padding: 16,
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#1e1e1e",
  },
  // Footer – expanded
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#1e1e1e",
    padding: 16,
    gap: 12,
  },
  footerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888",
    letterSpacing: 1.5,
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
  loginText: {
    color: "#0f0f0f",
    fontWeight: "700",
    fontSize: 14,
  },
});
