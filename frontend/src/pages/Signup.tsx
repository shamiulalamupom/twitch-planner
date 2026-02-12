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
    <div className="max-w-md space-y-3">
      <h1 className="text-xl font-semibold">Create account</h1>
      {err && <div className="border p-2 rounded text-sm">{err}</div>}
      <input
        className="border w-full p-2 rounded"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="border w-full p-2 rounded"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        className="border px-4 py-2 rounded"
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
        Sign up
      </button>
      <div className="text-sm">
        Already have an account?{" "}
        <Link className="underline" to="/login">
          Login
        </Link>
      </div>
    </div>
  );
}
