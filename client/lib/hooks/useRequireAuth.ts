import { router } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "../auth";

export function useRequireAuth() {
  const auth = useAuth();

  useEffect(() => {
    if (auth.loading) {
      return;
    }
    if (!auth.user) {
      router.replace("/(pages)/login");
    }
  }, [auth.user, auth.loading]);

  return auth;
}
