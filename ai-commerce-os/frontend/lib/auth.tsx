"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getMe, login as apiLogin, signup as apiSignup } from "./api";

export interface Workspace {
  id: string;
  businessName: string;
  niche: string;
  subscriptionTier: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  workspaces: Workspace[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const TOKEN_KEY = "ai_commerce_os_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMe = async (t: string) => {
    try {
      const data = await getMe(t);
      setUser(data.user);
      setWorkspaces(data.workspaces);
    } catch {
      // Token is stale/invalid — drop it rather than get stuck in a broken state.
      try { localStorage.removeItem(TOKEN_KEY); } catch {}
      setToken(null);
      setUser(null);
      setWorkspaces([]);
    }
  };

  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(TOKEN_KEY); } catch {}
    if (stored) {
      setToken(stored);
      loadMe(stored).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistToken = (t: string) => {
    try { localStorage.setItem(TOKEN_KEY, t); } catch {}
    setToken(t);
  };

  const login = async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    persistToken(data.token);
    setUser(data.user);
    await loadMe(data.token);
  };

  const signup = async (email: string, password: string) => {
    const data = await apiSignup(email, password);
    persistToken(data.token);
    setUser(data.user);
    await loadMe(data.token);
  };

  const logout = () => {
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
    setToken(null);
    setUser(null);
    setWorkspaces([]);
  };

  const refresh = async () => {
    if (token) await loadMe(token);
  };

  return (
    <AuthContext.Provider value={{ token, user, workspaces, loading, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
