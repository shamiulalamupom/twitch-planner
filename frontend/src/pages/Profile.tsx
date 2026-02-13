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
    <div className="tp-form max-w-lg">
      <p className="tp-subheading">profil</p>
      <h1 className="tp-title">Modifier le profil</h1>

      {msg && <div className="tp-form-note text-emerald-600">{msg}</div>}
      {err && <div className="tp-form-note text-red-600">{err}</div>}

      <input
        className="tp-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        className="tp-input"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Nouveau mot de passe (optionnel)"
        type="password"
      />
      <input
        className="tp-input"
        value={twitchUrl}
        onChange={(e) => setTwitchUrl(e.target.value)}
        placeholder="URL de la chaîne Twitch"
      />
      <input
        className="tp-input"
        value={logoUrl}
        onChange={(e) => setLogoUrl(e.target.value)}
        placeholder="URL du logo"
      />

      <div className="flex gap-3">
        <button
          className="tp-btn tp-btn-primary"
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
              setMsg("Profil enregistré.");
            } catch (e) {
              setErr(e instanceof ApiError ? e.message : "Save failed");
            }
          }}
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}
