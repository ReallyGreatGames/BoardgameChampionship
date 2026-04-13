import { BootstrapProvider } from "@/lib/bootstrap/BootstrapProvider";
import "@/lib/i18n/i18n";
import { AppDrawer } from "@/lib/components/AppDrawer";
import { Drawer } from "expo-router/drawer";
import "react-native-url-polyfill/auto";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { BarlowCondensed_600SemiBold } from "@expo-google-fonts/barlow-condensed/600SemiBold";
import { BarlowCondensed_700Bold } from "@expo-google-fonts/barlow-condensed/700Bold";
import { BarlowCondensed_800ExtraBold } from "@expo-google-fonts/barlow-condensed/800ExtraBold";
import { DMSans_400Regular } from "@expo-google-fonts/dm-sans/400Regular";
import { DMSans_500Medium } from "@expo-google-fonts/dm-sans/500Medium";
import { DMSans_700Bold } from "@expo-google-fonts/dm-sans/700Bold";
import { colors } from "@/lib/theme/colors";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <BootstrapProvider>
      <Drawer
        drawerContent={(props) => <AppDrawer {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerTitleStyle: {
            fontFamily: "BarlowCondensed_700Bold",
            fontSize: 20,
            color: colors.text,
          },
          headerShadowVisible: false,
          drawerStyle: { backgroundColor: colors.background },
          drawerActiveTintColor: colors.primary,
          drawerInactiveTintColor: colors.textMuted,
        }}
      >
        <Drawer.Screen
          name="index"
          options={{ drawerLabel: "Home", title: "Home" }}
        />
        <Drawer.Screen
          name="(pages)/login"
          options={{ drawerItemStyle: { display: "none" }, title: "Login" }}
        />
        <Drawer.Screen
          name="(pages)/admin"
          options={{ drawerLabel: "Admin", title: "Admin" }}
        />
        <Drawer.Screen
          name="(pages)/(team-player)/choose-team"
          options={{ drawerLabel: "Choose Team", title: "Choose Team" }}
        />
        <Drawer.Screen
          name="(pages)/(team-player)/choose-your-character"
          options={{ drawerLabel: "Choose Character", title: "Choose Character" }}
        />
      </Drawer>
    </BootstrapProvider>
  );
}
