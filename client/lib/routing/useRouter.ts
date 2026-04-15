import { type Href, router } from "expo-router";
import { type NavigationOptions } from "expo-router/build/global-state/routing";
import { useAuth } from "../auth";
import { usePlayer } from "../bootstrap/PlayerProvider";

export const useRouter = () => {
  const { user, isAdmin, isPinVerified } = useAuth();
  const { player, playerLoading } = usePlayer();

  const navigate = (path: Href, options?: NavigationOptions) => {
    router.navigate(path, options);
  };

  const routeDeterministic = () => {
    if (!user || (!isAdmin && !isPinVerified)) {
      navigate("/login");
      return;
    }

    if (isAdmin) {
      navigate("/admin");
      return;
    }

    if (playerLoading) return;

    if (!player) {
      navigate("/choose-your-character");
      return;
    }
  };

  return {
    navigate,
    routeDeterministic,
  };
};
