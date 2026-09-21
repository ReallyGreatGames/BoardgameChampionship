import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  lockAsync,
  OrientationLock,
} from "expo-screen-orientation";
import { AppState } from "react-native";

export type ScreenOrientationContext = {
  orientation: OrientationLock;
  forceOrientation: (o: OrientationLock) => Promise<void>;
  unlockOrientation: () => Promise<void>;
};

export const orientationContext = createContext<ScreenOrientationContext>({
  orientation: OrientationLock.PORTRAIT_UP,
  forceOrientation: async () => {},
  unlockOrientation: async () => {},
});

export const ScreenOrientationProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [orientation, setOrientation] = useState(OrientationLock.PORTRAIT_UP);
  const requestedOrientation = useRef(OrientationLock.PORTRAIT_UP);
  const pendingLock = useRef(Promise.resolve());

  const applyOrientation = useCallback(() => {
    // Native requests must finish in order. Read the latest target when each
    // request starts so a queued portrait reset cannot override timer focus.
    pendingLock.current = pendingLock.current
      .then(() => lockAsync(requestedOrientation.current))
      .catch((error) => {
        console.warn("Failed to apply screen orientation", error);
      });
    return pendingLock.current;
  }, []);

  useEffect(() => {
    void applyOrientation();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void applyOrientation();
      }
    });
    return () => subscription.remove();
  }, [applyOrientation]);

  const forceOrientation = useCallback(
    (o: OrientationLock) => {
      requestedOrientation.current = o;
      setOrientation(o);
      return applyOrientation();
    },
    [applyOrientation],
  );

  const unlockOrientation = useCallback(async () => {
    await forceOrientation(OrientationLock.PORTRAIT_UP);
  }, [forceOrientation]);

  return (
    <orientationContext.Provider
      value={{
        orientation,
        forceOrientation,
        unlockOrientation,
      }}
    >
      {children}
    </orientationContext.Provider>
  );
};

export const useScreenOrientation = () => {
  return useContext(orientationContext);
};
