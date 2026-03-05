import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { logout, pingAdminRoute } from "../lib/authClient";

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [pingMessage, setPingMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handlePing = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await pingAdminRoute();
      setPingMessage(response.message);
    } catch (requestError) {
      setPingMessage("");
      setError(requestError instanceof Error ? requestError.message : "Unable to reach admin route.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    navigate("/", { replace: true });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-10 sm:px-10">
      <div className="rounded-2xl border border-white/50 bg-white/70 p-8 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">
          Logged in as <span className="font-medium text-slate-800">{user?.email ?? "unknown"}</span>
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handlePing}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70"
          >
            {loading ? "Checking..." : "Ping /api/admin/ping"}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Logout
          </button>
        </div>

        {pingMessage ? <p className="mt-4 text-sm text-emerald-700">{pingMessage}</p> : null}
        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      </div>
    </main>
  );
}
