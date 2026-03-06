import { useMemo } from "react";
import { flushSync } from "react-dom";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import AmbientInnerBackground, { type AmbientVariant } from "../ambient/AmbientInnerBackground";
import DemoBackground from "../demo/DemoBackground";
import DemoGlassCard from "../demo/DemoGlassCard";
import { BUTTON_INTERACTIVE_CLASS, GLASS_INTERACTIVE_CLASS } from "../ui/glass";
import { DEMO_AUTH_STORAGE_KEYS } from "./constants";
import { logout } from "../../lib/authClient";
import { useAuth } from "../../context/AuthContext";
import { getAvatarImageUrl, getAvatarInitials } from "../../lib/avatar";
import SidebarVisual, { type SidebarVisualPreset } from "./SidebarVisual";

const STUDENT_NAV_ITEMS = [
  { label: "Overview", to: "/student/overview" },
  { label: "Submit Project", to: "/student/submit" },
  { label: "AI Review", to: "/student/ai-review" },
  { label: "Live Coding", to: "/student/live-coding" },
  { label: "Account", to: "/student/account" },
];

function getSectionTitle(pathname: string) {
  if (pathname.startsWith("/student/overview")) return "Overview";
  if (pathname.startsWith("/student/submit")) return "Submit Project";
  if (
    pathname.startsWith("/student/ai-review") ||
    pathname.startsWith("/student/review") ||
    pathname.startsWith("/student/analysis")
  ) {
    return "AI Review";
  }
  if (pathname.startsWith("/student/live-coding") || pathname.startsWith("/student/challenge")) return "Live Coding";
  if (pathname.startsWith("/student/account")) return "Account";
  return "Overview";
}

function getStudentAmbientVariant(pathname: string): AmbientVariant {
  if (pathname.startsWith("/student/overview")) return "student-overview";
  if (pathname.startsWith("/student/submit")) return "student-submit";
  if (
    pathname.startsWith("/student/ai-review") ||
    pathname.startsWith("/student/review") ||
    pathname.startsWith("/student/analysis")
  ) {
    return "student-review";
  }
  if (pathname.startsWith("/student/live-coding") || pathname.startsWith("/student/challenge")) return "student-challenge";
  if (pathname.startsWith("/student/account")) return "student-overview";
  return "student-overview";
}

function getStudentSidebarVisualPreset(pathname: string): SidebarVisualPreset {
  if (pathname.startsWith("/student/overview")) return "overview";
  if (pathname.startsWith("/student/submit") || pathname.startsWith("/student/submit-project")) return "submit";
  if (
    pathname.startsWith("/student/ai-review") ||
    pathname.startsWith("/student/review") ||
    pathname.startsWith("/student/analysis")
  ) {
    return "aiReview";
  }
  if (pathname.startsWith("/student/live-coding") || pathname.startsWith("/student/challenge")) return "liveCoding";
  if (pathname.startsWith("/student/account")) return "account";
  return "overview";
}

export default function StudentLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const sectionTitle = getSectionTitle(location.pathname);
  const ambientVariant = getStudentAmbientVariant(location.pathname);
  const sidebarVisualPreset = getStudentSidebarVisualPreset(location.pathname);
  const ambientDebug = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("bgdebug") === "1" || params.get("ambient") === "1";
  }, [location.search]);

  const { user, setUser } = useAuth();
  const avatarImageUrl = getAvatarImageUrl(user);
  const avatarInitials = getAvatarInitials(user?.name ?? "User");

  const onSignOut = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
    DEMO_AUTH_STORAGE_KEYS.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    flushSync(() => setUser(null));
    navigate("/auth", { replace: true });
  };

  return (
    <DemoBackground>
      <div className="relative isolate mx-auto flex min-h-screen w-full max-w-[1380px] gap-6 px-4 py-6 sm:px-6">
        <AmbientInnerBackground
          variant={ambientVariant}
          debug={ambientDebug}
          className="z-[1]"
        />
        {ambientDebug ? (
          <div className="pointer-events-none absolute right-4 top-3 z-[30] rounded-full border border-cyan-300/85 bg-cyan-50/95 px-3 py-1 text-[10px] font-bold tracking-[0.1em] text-cyan-900 shadow-[0_8px_22px_rgba(34,211,238,0.28)]">
            BG DEBUG ON
          </div>
        ) : null}

        <aside className="relative z-[2] hidden h-[calc(100vh-3rem)] w-64 shrink-0 self-start md:block" aria-label="Student navigation">
          <DemoGlassCard className={`sticky top-6 flex h-[calc(100vh-3rem)] flex-col p-4 ${GLASS_INTERACTIVE_CLASS}`}>
            <div className="shrink-0">
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
            </div>

            <div className="mt-4 flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/45 bg-white/20">
              <SidebarVisual preset={sidebarVisualPreset} className="h-full w-full" />
            </div>
          </DemoGlassCard>
        </aside>

        <div className="relative z-[2] flex min-w-0 flex-1 flex-col gap-6">
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/student/account")}
                  className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white/55 text-xs font-semibold text-slate-700 shadow-[0_8px_20px_rgba(30,64,175,0.08)] transition hover:bg-white/75 ${BUTTON_INTERACTIVE_CLASS}`}
                  aria-label="Open account section"
                >
                  <span className="absolute inset-0 flex items-center justify-center bg-blue-100/80 text-[11px] font-semibold text-blue-700">
                    {avatarInitials}
                  </span>
                  {avatarImageUrl ? (
                    <img
                      src={avatarImageUrl}
                      alt={`${user?.name ?? "User"} avatar`}
                      className="relative z-[1] h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={onSignOut}
                  className={`rounded-xl border border-white/60 bg-white/50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-[0_8px_20px_rgba(30,64,175,0.08)] transition hover:bg-white/75 ${BUTTON_INTERACTIVE_CLASS}`}
                >
                  Sign out
                </button>
              </div>
            </div>

            <nav className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 md:hidden" aria-label="Student navigation">
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
