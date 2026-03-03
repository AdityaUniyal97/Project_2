import { motion } from "framer-motion";

const NAV_LINKS = ["Home", "Features", "Blog", "Pricing"];

interface Props {
  authMode: "signin" | "signup";
  onAuthClick: () => void;
}

export default function TopNav({ authMode, onAuthClick }: Props) {
  return (
    <nav className="relative z-20 flex w-full items-center justify-between px-6 py-4 sm:px-10">
      {/* left links */}
      <div className="flex items-center gap-7">
        {NAV_LINKS.map((label) => (
          <button
            key={label}
            type="button"
            className="text-[14px] font-medium text-slate-500 transition-colors hover:text-slate-800"
          >
            {label}
          </button>
        ))}
      </div>

      {/* right sign-up */}
      <motion.button
        type="button"
        onClick={onAuthClick}
        whileTap={{ scale: 0.975 }}
        whileHover={{ translateY: -1, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="rounded-lg border border-slate-200/60 bg-white/45 px-4 py-1.5 text-[13px] font-medium text-slate-600 backdrop-blur-sm transition-all hover:bg-white/80 hover:text-slate-800"
        aria-label={authMode === "signin" ? "Sign up" : "Sign in"}
      >
        {authMode === "signin" ? "Sign Up" : "Sign In"}
      </motion.button>
    </nav>
  );
}
