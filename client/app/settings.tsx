import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Settings</Text>

      <Pressable
        style={styles.item}
        onPress={() => router.navigate("/choose-your-character?from=settings")}
      >
        <Text style={styles.itemText}>Change Player / Team</Text>
        <Text style={styles.itemChevron}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    padding: 32,
    paddingTop: 64,
  },
  back: {
    color: "#888",
    fontSize: 14,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 32,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    padding: 16,
  },
  itemText: {
    fontSize: 16,
    color: "#fff",
  },
  itemChevron: {
    fontSize: 20,
    color: "#888",
  },
});
