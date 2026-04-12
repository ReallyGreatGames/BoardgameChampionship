import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Account, Models } from "react-native-appwrite";
import client from "./appwrite";

const account = new Account(client);

const USER_EMAIL = process.env.EXPO_PUBLIC_USER_EMAIL ?? "";

type AuthContextType = {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPin: (pin: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    account
      .get()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    await account.createEmailPasswordSession(email, password);
    const u = await account.get();
    setUser(u);
  }

  async function loginWithPin(pin: string) {
    await account.createEmailPasswordSession(USER_EMAIL, pin);
    const u = await account.get();
    setUser(u);
  }

  async function logout() {
    await account.deleteSession("current");
    setUser(null);
  }

  const isAdmin = !!user?.labels?.includes("admin");

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithPin, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { account };
