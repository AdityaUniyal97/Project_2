import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import DemoBackground from "../demo/DemoBackground";
import DemoGlassCard from "../demo/DemoGlassCard";
import { DEMO_AUTH_STORAGE_KEYS } from "./constants";
import { BUTTON_INTERACTIVE_CLASS, GLASS_INTERACTIVE_CLASS } from "../ui/glass";

const STUDENT_NAV_ITEMS = [
  { label: "Overview", to: "/student/overview" },
  { label: "Submit Project", to: "/student/submit" },
];

function getSectionTitle(pathname: string) {
  if (pathname.startsWith("/student/overview")) return "Overview";
  if (pathname.startsWith("/student/submit")) return "Submit Project";
  return "Overview";
}

export default function StudentLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const sectionTitle = getSectionTitle(location.pathname);

  const onSignOut = () => {
    DEMO_AUTH_STORAGE_KEYS.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    navigate("/", { replace: true });
  };

  return (
    <DemoBackground>
      <div className="mx-auto flex min-h-screen w-full max-w-[1380px] gap-4 px-4 py-6 sm:px-8">
        <aside className="hidden w-64 shrink-0 md:block">
          <DemoGlassCard className={`sticky top-6 p-4 ${GLASS_INTERACTIVE_CLASS}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              ProjectGuard AI
            </p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
              Student
            </p>
            <div className="my-4 h-px bg-white/35" />

            <nav className="space-y-2">
              {STUDENT_NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} end>
                  {({ isActive }) => (
                    <span
                      className={`group relative flex items-center rounded-xl px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? "border border-white/65 bg-white/70 text-slate-800 shadow-[0_10px_22px_rgba(30,64,175,0.12)]"
                          : "border border-transparent bg-white/20 text-slate-600 hover:bg-white/45 hover:text-slate-800"
                      }`}
                    >
                      <span
                        className={`mr-2.5 h-1.5 w-1.5 rounded-full transition-all ${
                          isActive
                            ? "bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.7)]"
                            : "bg-slate-300 group-hover:bg-blue-300/80 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        }`}
                      />
                      {item.label}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="my-4 h-px bg-white/35" />
            <p className="text-[11px] text-slate-500/90">
              Submission analytics and AI review activity
            </p>
          </DemoGlassCard>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <DemoGlassCard className={`p-4 ${GLASS_INTERACTIVE_CLASS}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Student
                </p>
                <h1 className="text-base font-semibold text-slate-900 sm:text-lg">
                  {sectionTitle}
                </h1>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className={`rounded-xl border border-white/60 bg-white/50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-[0_8px_20px_rgba(30,64,175,0.08)] transition hover:bg-white/75 ${BUTTON_INTERACTIVE_CLASS}`}
              >
                Sign out
              </button>
            </div>

            <nav className="mt-4 flex items-center gap-2 md:hidden">
              {STUDENT_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    `rounded-xl px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                      isActive
                        ? "border border-white/65 bg-white/70 text-slate-800 shadow-[0_8px_20px_rgba(30,64,175,0.12)]"
                        : "border border-transparent bg-white/25 text-slate-600 hover:border-white/40 hover:bg-white/45 hover:text-slate-800"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </DemoGlassCard>

          <Outlet />
        </div>
      </div>
    </DemoBackground>
  );
}
