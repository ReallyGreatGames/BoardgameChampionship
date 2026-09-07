// Browser no-op shim for expo-secure-store (design-sync bundle only).
// lib/secureStorage.ts only calls these on native (web uses localStorage).
export async function setItemAsync(_key: string, _value: string): Promise<void> {}

export async function getItemAsync(_key: string): Promise<string | null> {
  return null;
}

export async function deleteItemAsync(_key: string): Promise<void> {}
