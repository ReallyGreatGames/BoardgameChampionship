import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../../lib/auth";
import { useScreenOrientation } from "@/lib/bootstrap/ScreenOrientationProvider";
import { OrientationLock } from "expo-screen-orientation";

export default function AdminLayout() {
  const { user, loading, isAdmin } = useAuth();
  const { forceOrientation, unlockOrientation } = useScreenOrientation();

  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) {
      router.replace("/login");
    }
  }, [user, loading, isAdmin]);

  useFocusEffect(
    useCallback(() => {
      forceOrientation(OrientationLock.LANDSCAPE_RIGHT);
      return () => {
        unlockOrientation().catch(console.error);
      };
    }, [forceOrientation, unlockOrientation])
  );

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0f0f0f",
        }}
      >
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!user || !isAdmin) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
