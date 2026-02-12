import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Plan your streams in minutes</h1>
      <p className="text-gray-600">
        Create a weekly planning, add events, and keep your schedule organized.
      </p>
      <div className="flex gap-3">
        <Link className="border px-4 py-2 rounded" to="/signup">
          Create account
        </Link>
        <Link className="border px-4 py-2 rounded" to="/login">
          Login
        </Link>
      </div>
    </div>
  );
}
