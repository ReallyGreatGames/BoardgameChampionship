import { BootstrapProvider } from "@/lib/bootstrap/BootstrapProvider";
import { useTournament } from "@/lib/bootstrap/TournamentProvider";
import { AppDrawer, drawerScreenOptions } from "@/lib/components/AppDrawer";
import "@/lib/i18n/i18n";
import { BarlowCondensed_600SemiBold } from "@expo-google-fonts/barlow-condensed/600SemiBold";
import { BarlowCondensed_700Bold } from "@expo-google-fonts/barlow-condensed/700Bold";
import { BarlowCondensed_800ExtraBold } from "@expo-google-fonts/barlow-condensed/800ExtraBold";
import { DMSans_400Regular } from "@expo-google-fonts/dm-sans/400Regular";
import { DMSans_500Medium } from "@expo-google-fonts/dm-sans/500Medium";
import { DMSans_700Bold } from "@expo-google-fonts/dm-sans/700Bold";
import { useFonts } from "expo-font";
import { Drawer } from "expo-router/drawer";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "react-native-url-polyfill/auto";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { t } = useTranslation(["menu"]);
  const { type } = useTournament();
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
        screenOptions={drawerScreenOptions}
      >
        <Drawer.Screen
          name="(pages)/login"
          options={{
            title: t(type),
          }}
        />
        <Drawer.Screen
          name="index"
          options={{
            title: "",
          }}
        />
        <Drawer.Screen
          name="(pages)/settings"
          options={{
            title: t("entries.settings"),
          }}
        />
        <Drawer.Screen
          name="(pages)/info"
          options={{
            title: t("entries.info"),
          }}
        />
        <Drawer.Screen
          name="(pages)/admin"
          options={{ drawerLabel: "Dashboard", title: "Admin Dashboard" }}
        />
        <Drawer.Screen
          name="(pages)/(user)"
          options={{ drawerLabel: t("entries.schedule"), title: t("entries.schedule") }}
        />
        <Drawer.Screen
          name="(pages)/(team-player)/choose-your-character"
          options={{
            title: t("entries.chooseYourCharacter"),
          }}
        />
      </Drawer>
    </BootstrapProvider>
  );
}
