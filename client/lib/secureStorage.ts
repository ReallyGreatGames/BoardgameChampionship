import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const hasLocalStorage = Platform.OS === "web" && typeof localStorage !== "undefined";

export async function setItemAsync(key: string, value: string): Promise<void> {
  if (hasLocalStorage) {
    localStorage.setItem(key, value);
  } else if (Platform.OS !== "web") {
    await SecureStore.setItemAsync(key, value);
  }
}

export async function getItemAsync(key: string): Promise<string | null> {
  if (hasLocalStorage) {
    return localStorage.getItem(key);
  }
  if (Platform.OS !== "web") {
    return SecureStore.getItemAsync(key);
  }
  return null;
}

export async function deleteItemAsync(key: string): Promise<void> {
  if (hasLocalStorage) {
    localStorage.removeItem(key);
  } else if (Platform.OS !== "web") {
    await SecureStore.deleteItemAsync(key);
  }
}
