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
  addOrientationChangeListener,
  getOrientationAsync,
  lockAsync,
  Orientation,
  OrientationLock,
} from "expo-screen-orientation";
import { AppState, Platform } from "react-native";

const LOCK_ORIENTATIONS: Partial<Record<OrientationLock, readonly Orientation[]>> = {
  [OrientationLock.PORTRAIT]: [Orientation.PORTRAIT_UP, Orientation.PORTRAIT_DOWN],
  [OrientationLock.PORTRAIT_UP]: [Orientation.PORTRAIT_UP],
  [OrientationLock.PORTRAIT_DOWN]: [Orientation.PORTRAIT_DOWN],
  [OrientationLock.LANDSCAPE]: [Orientation.LANDSCAPE_LEFT, Orientation.LANDSCAPE_RIGHT],
  [OrientationLock.LANDSCAPE_LEFT]: [Orientation.LANDSCAPE_LEFT],
  [OrientationLock.LANDSCAPE_RIGHT]: [Orientation.LANDSCAPE_RIGHT],
};

const ORIENTATION_CHECK_DELAY_MS = 250;
const MAX_ORIENTATION_RETRIES = 8;

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

  useEffect(() => {
    const expectedOrientations = LOCK_ORIENTATIONS[orientation] ?? [];
    if (Platform.OS === "web" || expectedOrientations.length === 0) {
      return;
    }

    let disposed = false;
    let checking = false;
    let retries = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    function scheduleCheck() {
      if (disposed || checking || timeout !== undefined || retries >= MAX_ORIENTATION_RETRIES) {
        return;
      }
      timeout = setTimeout(checkOrientation, ORIENTATION_CHECK_DELAY_MS);
    }

    async function checkOrientation() {
      timeout = undefined;
      checking = true;
      try {
        const actualOrientation = await getOrientationAsync();
        if (disposed) {
          return;
        }
        if (expectedOrientations.includes(actualOrientation)) {
          retries = 0;
          return;
        }
        // Accepting a native lock does not guarantee the window has rotated:
        // a navigation or modal transition may still be finishing.
        retries += 1;
        await applyOrientation();
      } catch (error) {
        retries += 1;
        if (!disposed) {
          console.warn("Failed to verify screen orientation", error);
        }
      } finally {
        checking = false;
      }
      scheduleCheck();
    }

    scheduleCheck();
    const orientationSubscription = addOrientationChangeListener(({ orientationInfo }) => {
      if (expectedOrientations.includes(orientationInfo.orientation)) {
        retries = 0;
      } else {
        scheduleCheck();
      }
    });
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        retries = 0;
        scheduleCheck();
      }
    });

    return () => {
      disposed = true;
      clearTimeout(timeout);
      orientationSubscription.remove();
      appStateSubscription.remove();
    };
  }, [orientation, applyOrientation]);

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
