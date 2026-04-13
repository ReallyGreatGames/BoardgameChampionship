import "react-native-url-polyfill/auto";
import { Stack } from "expo-router";
import { AuthProvider } from "../lib/auth";
import { BootstrapProvider } from "@/lib/bootstrap/BootstrapProvider";
import "@/lib/i18n/i18n";

export default function RootLayout() {
  return (
    <BootstrapProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </BootstrapProvider>
  );
}
