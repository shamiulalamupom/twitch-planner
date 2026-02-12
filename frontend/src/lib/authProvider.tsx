import React, { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import type { User } from "./types";
import { AuthCtx, type AuthState } from "./authContext";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token"),
  );
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMe(t: string) {
    const res = await api<{ user: User }>("/me", { token: t });
    setUser(res.user);
  }

  useEffect(() => {
    (async () => {
      try {
        if (token) await loadMe(token);
      } catch {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function signup(email: string, password: string) {
    const res = await api<{ token: string; user: User }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("token", res.token);
    setToken(res.token);
    setUser(res.user);
  }

  async function login(email: string, password: string) {
    const res = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("token", res.token);
    setToken(res.token);
    setUser(res.user);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  const value: AuthState = useMemo(
    () => ({ token, user, loading, signup, login, logout }),
    [token, user, loading],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
