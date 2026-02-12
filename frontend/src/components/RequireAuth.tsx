import type { JSX, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/useAuth";

export function RequireAuth({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const { token, loading } = useAuth();

  if (loading) return <div className="p-6">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
