import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "bgcs:cache:v1:";

const storageKey = (key: string) => `${PREFIX}${key}`;

export async function loadCachedCollection<T>(key: string): Promise<T[] | null> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(key));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch (e) {
    console.warn(`[cache] failed to load collection ${key}`, e);
    return null;
  }
}

export async function saveCachedCollection<T>(
  key: string,
  collection: T[],
): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(key), JSON.stringify(collection));
  } catch (e) {
    console.warn(`[cache] failed to save collection ${key}`, e);
  }
}

export async function clearCachedCollection(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(storageKey(key));
  } catch (e) {
    console.warn(`[cache] failed to clear collection ${key}`, e);
  }
}
