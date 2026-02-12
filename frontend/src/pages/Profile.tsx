import { useState } from "react";
import { useAuth } from "../lib/useAuth";
import { api, ApiError } from "../lib/api";

export function Profile() {
  const { token, user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [twitchUrl, setTwitchUrl] = useState(user?.twitchUrl ?? "");
  const [logoUrl, setLogoUrl] = useState(user?.logoUrl ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="max-w-lg space-y-3">
      <h1 className="text-xl font-semibold">Profile</h1>
      {msg && <div className="border p-2 rounded text-sm">{msg}</div>}
      {err && <div className="border p-2 rounded text-sm">{err}</div>}

      <input
        className="border w-full p-2 rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        className="border w-full p-2 rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password (optional)"
        type="password"
      />
      <input
        className="border w-full p-2 rounded"
        value={twitchUrl}
        onChange={(e) => setTwitchUrl(e.target.value)}
        placeholder="Twitch channel URL"
      />
      <input
        className="border w-full p-2 rounded"
        value={logoUrl}
        onChange={(e) => setLogoUrl(e.target.value)}
        placeholder="Logo URL"
      />

      <button
        className="border px-4 py-2 rounded"
        onClick={async () => {
          setMsg(null);
          setErr(null);
          try {
            await api("/me", {
              method: "PUT",
              token: token!,
              body: JSON.stringify({
                email,
                ...(password ? { password } : {}),
                twitchUrl: twitchUrl || null,
                logoUrl: logoUrl || null,
              }),
            });
            setPassword("");
            setMsg("Saved.");
          } catch (e) {
            setErr(e instanceof ApiError ? e.message : "Save failed");
          }
        }}
      >
        Save
      </button>
    </div>
  );
}
