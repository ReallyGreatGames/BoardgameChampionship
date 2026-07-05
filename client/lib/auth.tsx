import { router } from "expo-router";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Models, Query } from "react-native-appwrite";
import { account, DATABASE_ID, tablesDB } from "./appwrite";
import { useTournament } from "./bootstrap/TournamentProvider";
import * as SecureStore from "./secureStorage";
import { useTournamentStore } from "./stores/appwrite/tournament-store";

const PIN_COLLECTION_ID = "tournament";
export const PIN_STORE_KEY = "bgcs_pin_auth";
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

async function getOrCreateAnonymousSession(): Promise<Models.User<Models.Preferences> | null> {
  return account.get().catch(async () => {
    await account.createAnonymousSession();
    return account.get().catch(() => null);
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
        if (!raw) {
          // No verified PIN — stay logged out, but still establish at least
          // an anonymous session so pre-login reads (e.g. checking whether
          // the tournament is active, on the login screen) work.
          await getOrCreateAnonymousSession();
          return;
        }

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
    await account.deleteSessions().catch(() => {});
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

  const { active: tournamentActive } = useTournament();
  const tournamentInitialized = useTournamentStore((s) => s.initialized);

  // Force-logout: once the tournament is confirmed inactive, non-admin
  // sessions can no longer stay logged in. Gated on tournamentInitialized so
  // the still-empty store on a cold start (before its first realtime fetch
  // resolves) isn't mistaken for "no active tournament".
  useEffect(() => {
    if (loading || !tournamentInitialized) {
      return;
    }
    if (!tournamentActive && isPinVerified) {
      logout();
      router.replace("/");
    }
  }, [loading, tournamentInitialized, tournamentActive, isPinVerified]);

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
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
