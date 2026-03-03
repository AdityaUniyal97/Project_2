import { Link, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Student Demo", to: "/student" },
  { label: "Teacher Dashboard", to: "/teacher" },
];

export default function DemoTopNav() {
  const location = useLocation();

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pb-4 pt-6 sm:px-8">
      <Link
        to="/"
        className="rounded-2xl border border-white/45 bg-white/35 px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_10px_30px_rgba(29,78,216,0.08)] backdrop-blur-xl transition hover:bg-white/55"
      >
        ProjectGuard AI
      </Link>
      <nav className="flex items-center gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                isActive
                  ? "border border-white/60 bg-white/70 text-slate-800 shadow-[0_8px_20px_rgba(30,64,175,0.12)]"
                  : "border border-transparent bg-white/20 text-slate-600 hover:border-white/40 hover:bg-white/40 hover:text-slate-800"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
