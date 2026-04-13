import { BootstrapProvider } from "@/lib/bootstrap/BootstrapProvider";
import { AppDrawer, drawerScreenOptions } from "@/lib/components/AppDrawer";
import "@/lib/i18n/i18n";
import { Drawer } from "expo-router/drawer";
import "react-native-url-polyfill/auto";

export default function RootLayout() {
  return (
    <BootstrapProvider>
      <Drawer
        drawerContent={(props) => <AppDrawer {...props} />}
        screenOptions={drawerScreenOptions}
      >
      </Drawer>
    </BootstrapProvider>
  );
}
