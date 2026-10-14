import NetInfo from "@react-native-community/netinfo";
import { useEffect } from "react";
import { useConnectivityStore } from "../stores/connectivity-store";

export function ConnectivityProvider() {
  const setOnline = useConnectivityStore((s) => s.setOnline);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online =
        state.isConnected === true && state.isInternetReachable !== false;
      setOnline(online);
    });

    return () => unsubscribe();
  }, [setOnline]);

  return null;
}
