import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  lockAsync,
  OrientationLock,
  unlockAsync,
} from "expo-screen-orientation";

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
  useEffect(() => {
    lockAsync(OrientationLock.PORTRAIT_UP).catch(() => {});
  }, []);
  const forceOrientation = useCallback(async (o: OrientationLock) => {
    setOrientation(o);
    await lockAsync(o).catch(() => {});
  }, []);

  const unlockOrientation = useCallback(async () => {
    setOrientation(OrientationLock.PORTRAIT_UP);
    await lockAsync(OrientationLock.PORTRAIT_UP).catch(() => {});
  }, []);

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
