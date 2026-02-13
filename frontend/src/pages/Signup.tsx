import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { ApiError } from "../lib/api";

export function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="tp-form max-w-md">
      <p className="tp-subheading">inscription</p>
      <h1 className="tp-title">Créer un compte</h1>
      {err && (
        <div className="text-sm text-red-600">
          {err}
        </div>
      )}

      <input
        className="tp-input"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="tp-input"
        placeholder="Mot de passe"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div className="flex flex-wrap gap-3">
        <button
          className="tp-btn tp-btn-primary"
          onClick={async () => {
            setErr(null);
            try {
              await signup(email, password);
              nav("/plannings");
            } catch (e) {
              setErr(e instanceof ApiError ? e.message : "Signup failed");
            }
          }}
        >
          Créer
        </button>
        <Link to="/login" className="tp-btn tp-btn-secondary">
          Connexion
        </Link>
      </div>
    </div>
  );
}
