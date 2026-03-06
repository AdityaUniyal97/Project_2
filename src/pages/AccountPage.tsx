import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout } from "../lib/authClient";
import DemoGlassCard from "../components/demo/DemoGlassCard";
import { GLASS_INTERACTIVE_CLASS, BUTTON_INTERACTIVE_CLASS } from "../components/ui/glass";

export default function AccountPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore logout errors
    }
    setUser(null);
    navigate("/auth", { replace: true });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="w-full space-y-6">
      <DemoGlassCard className={`p-6 ${GLASS_INTERACTIVE_CLASS}`}>
        <h2 className="text-lg font-semibold text-slate-900">Account Details</h2>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 rounded-xl border border-white/50 bg-white/40 px-4 py-3">
            <span className="text-[13px] font-medium text-slate-500 w-20">Name</span>
            <span className="text-[14px] font-semibold text-slate-800">{user.name}</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/50 bg-white/40 px-4 py-3">
            <span className="text-[13px] font-medium text-slate-500 w-20">Email</span>
            <span className="text-[14px] font-semibold text-slate-800">{user.email}</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/50 bg-white/40 px-4 py-3">
            <span className="text-[13px] font-medium text-slate-500 w-20">Role</span>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-[12px] font-semibold capitalize text-blue-700">
              {user.role}
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/50 bg-white/40 px-4 py-3">
            <span className="text-[13px] font-medium text-slate-500 w-20">Joined</span>
            <span className="text-[14px] text-slate-700">
              {new Date(user.createdAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </DemoGlassCard>

      <DemoGlassCard className={`p-6 ${GLASS_INTERACTIVE_CLASS}`}>
        <h2 className="text-lg font-semibold text-slate-900">Actions</h2>
        <div className="mt-4">
          <button
            type="button"
            onClick={handleLogout}
            className={`rounded-xl border border-red-200 bg-red-50/80 px-5 py-2.5 text-[13px] font-semibold text-red-700 shadow-sm transition hover:bg-red-100 ${BUTTON_INTERACTIVE_CLASS}`}
          >
            Sign Out
          </button>
        </div>
      </DemoGlassCard>
    </div>
  );
}
