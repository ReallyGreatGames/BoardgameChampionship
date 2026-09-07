// Browser no-op shim for expo-screen-orientation (design-sync bundle only).
// BottomSheet locks orientation on native; irrelevant in browser previews.
export enum OrientationLock {
  DEFAULT = 0,
  ALL = 1,
  PORTRAIT = 2,
  PORTRAIT_UP = 3,
  PORTRAIT_DOWN = 4,
  LANDSCAPE = 5,
  LANDSCAPE_LEFT = 6,
  LANDSCAPE_RIGHT = 7,
}

export async function getOrientationLockAsync(): Promise<OrientationLock> {
  return OrientationLock.DEFAULT;
}

export async function lockAsync(_lock: OrientationLock): Promise<void> {}
