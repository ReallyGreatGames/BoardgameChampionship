import { BootstrapProvider } from "@/lib/bootstrap/BootstrapProvider";
import "@/lib/i18n/i18n";
import { AppDrawer } from "@/lib/components/AppDrawer";
import { Drawer } from "expo-router/drawer";
import "react-native-url-polyfill/auto";

export default function RootLayout() {
  return (
    <BootstrapProvider>
      <Drawer
        drawerContent={(props) => <AppDrawer {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: "#0f0f0f" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
          drawerStyle: { backgroundColor: "#0f0f0f" },
          drawerActiveTintColor: "#fff",
          drawerInactiveTintColor: "#888",
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: "Home",
            title: "Home",
          }}
        />
        <Drawer.Screen
          name="(pages)/login"
          options={{
            drawerItemStyle: { display: "none" },
            title: "Login",
          }}
        />
        <Drawer.Screen
          name="(pages)/admin"
          options={{
            drawerLabel: "Admin",
            title: "Admin",
          }}
        />
        <Drawer.Screen
          name="(pages)/(team-player)/choose-team"
          options={{
            drawerLabel: "Choose Team",
            title: "Choose Team",
          }}
        />
        <Drawer.Screen
          name="(pages)/(team-player)/choose-your-character"
          options={{
            drawerLabel: "Choose Character",
            title: "Choose Character",
          }}
        />
      </Drawer>
    </BootstrapProvider>
  );
}
