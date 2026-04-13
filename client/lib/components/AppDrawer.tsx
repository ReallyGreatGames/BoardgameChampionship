import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { type } from "../theme/typography";
import { inset } from "../theme/spacing";
import { colors } from "../theme/colors";

function DrawerHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Boardgame Championship</Text>
      <Pressable onPress={() => {}} hitSlop={12}>
        <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
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
          <Ionicons name="settings-outline" size={22} color={colors.primary} />
        </Pressable>
        <Pressable
          style={styles.iconButton}
          onPress={() => router.push("/(pages)/login")}
        >
          <Ionicons name="log-in-outline" size={22} color={colors.primary} />
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
});
