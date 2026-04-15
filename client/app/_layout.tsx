import { BootstrapProvider } from "@/lib/bootstrap/BootstrapProvider";
import { AppDrawer, drawerScreenOptions } from "@/lib/components/AppDrawer";
import "@/lib/i18n/i18n";
import { Drawer } from "expo-router/drawer";
import { useTranslation } from "react-i18next";
import "react-native-url-polyfill/auto";

export default function RootLayout() {
  const { t } = useTranslation(["menu"]);
  return (
    <BootstrapProvider>
      <Drawer
        drawerContent={(props) => <AppDrawer {...props} />}
        screenOptions={drawerScreenOptions}
      >
        <Drawer.Screen
          name="(pages)/login"
          options={{
            title: "",
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
          name="(pages)/(team-player)/choose-your-character"
          options={{
            title: t("entries.chooseYourCharacter"),
          }}
        />
      </Drawer>
    </BootstrapProvider>
  );
}
