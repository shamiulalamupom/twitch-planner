import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/useAuth";

export function Layout() {
  const { token, user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-[#E9E5FF] text-slate-900">
      <header className="border-b border-black/10 bg-white/60 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold">
            TwitchPlanner
          </Link>
          <nav className="flex items-center gap-3">
            {token ? (
              <>
                <Link to="/plannings" className="text-sm">
                  Plannings
                </Link>
                <Link to="/profile" className="text-sm">
                  {user?.email ?? "Profile"}
                </Link>
                <button
                  className="text-sm border px-3 py-1 rounded"
                  onClick={() => {
                    logout();
                    nav("/");
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm">
                  Login
                </Link>
                <Link to="/signup" className="text-sm border px-3 py-1 rounded">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
