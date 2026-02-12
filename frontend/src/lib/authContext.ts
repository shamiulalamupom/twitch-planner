import { createContext } from "react";
import type { User } from "./types";

export type AuthState = {
  token: string | null;
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

export const AuthCtx = createContext<AuthState | null>(null);
