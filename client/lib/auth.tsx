import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Query, Models } from "react-native-appwrite";
import * as SecureStore from "./secureStorage";
import { account, tablesDB } from "./appwrite";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const PIN_COLLECTION_ID = "tournament";
const PIN_STORE_KEY = "bgcs_pin_auth";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

type StoredPin = {
  pin: string;
  lastVerified: number;
};

type AuthContextType = {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPin: (pin: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isPinVerified: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

async function getOrCreateAnonymousSession(): Promise<
  Models.User<Models.Preferences>
> {
  return account.get().catch(async () => {
    await account.createAnonymousSession();
    return account.get();
  });
}

async function verifyPinInDb(pin: string): Promise<boolean> {
  const result = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: PIN_COLLECTION_ID,
    queries: [Query.equal("pin", pin), Query.equal("active", true)],
  });

  return result.total > 0;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null,
  );
  const [pinVerified, setPinVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const existing = await account.get().catch(() => null);
        if (existing?.email) {
          setUser(existing);
          return;
        }

        const raw = await SecureStore.getItemAsync(PIN_STORE_KEY);
        if (!raw) return;

        const stored: StoredPin = JSON.parse(raw);
        const now = Date.now();

        if (now - stored.lastVerified > ONE_DAY_MS) {
          // Re-verify against DB — need a session to query
          const u = await getOrCreateAnonymousSession();
          const valid = await verifyPinInDb(stored.pin);
          if (!valid) {
            await SecureStore.deleteItemAsync(PIN_STORE_KEY);
            await account.deleteSessions().catch(() => {});
            return;
          }
          await SecureStore.setItemAsync(
            PIN_STORE_KEY,
            JSON.stringify({ pin: stored.pin, lastVerified: now }),
          );
          setUser(u);
          setPinVerified(true);
        } else {
          const u = await getOrCreateAnonymousSession();
          setUser(u);
          setPinVerified(true);
        }
      } catch {
        setUser(null);
        setPinVerified(false);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function login(email: string, password: string) {
    await account.createEmailPasswordSession({ email, password });
    const u = await account.get();
    setUser(u);
  }

  async function loginWithPin(pin: string) {
    const u = await getOrCreateAnonymousSession();
    try {
      const valid = await verifyPinInDb(pin);
      if (!valid) {
        await account.deleteSessions().catch(() => {});
        throw new Error("Invalid PIN");
      }
      await SecureStore.setItemAsync(
        PIN_STORE_KEY,
        JSON.stringify({ pin, lastVerified: Date.now() }),
      );
      setUser(u);
      setPinVerified(true);
    } catch (e) {
      await account.deleteSessions().catch(() => {});
      throw e;
    }
  }

  async function logout() {
    await SecureStore.deleteItemAsync(PIN_STORE_KEY);
    await account.deleteSessions();
    setUser(null);
    setPinVerified(false);
  }

  const isAdmin = !!user?.labels?.includes("admin");
  const isPinVerified = !isAdmin && pinVerified;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithPin,
        logout,
        isAdmin,
        isPinVerified,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
