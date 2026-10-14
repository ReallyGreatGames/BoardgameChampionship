import { Models } from "react-native-appwrite";
import * as SecureStorage from "../secureStorage";

const AUTH_CACHE_KEY = "bgcs_auth_state";

export type CachedAuthState = {
  user: Models.User<Models.Preferences>;
  pinVerified: boolean;
};

export async function loadCachedAuth(): Promise<CachedAuthState | null> {
  try {
    const raw = await SecureStorage.getItemAsync(AUTH_CACHE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as CachedAuthState;
    if (!parsed?.user || typeof parsed.user.$id !== "string") {
      await SecureStorage.deleteItemAsync(AUTH_CACHE_KEY);
      return null;
    }
    return parsed;
  } catch (e) {
    console.warn("[cache] failed to load auth state", e);
    return null;
  }
}

export async function saveCachedAuth(state: CachedAuthState): Promise<void> {
  try {
    await SecureStorage.setItemAsync(AUTH_CACHE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("[cache] failed to save auth state", e);
  }
}

export async function clearCachedAuth(): Promise<void> {
  try {
    await SecureStorage.deleteItemAsync(AUTH_CACHE_KEY);
  } catch (e) {
    console.warn("[cache] failed to clear auth state", e);
  }
}
