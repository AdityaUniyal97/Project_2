import { motion } from "framer-motion";

interface Props {
  onSignupClick: () => void;
}

export default function LoginCard({ onSignupClick }: Props) {
  return (
    <div
      className="relative z-10 w-full max-w-[460px] rounded-3xl border border-white/45 p-8 sm:p-10"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(240,248,255,0.62) 100%)",
        backdropFilter: "blur(30px) saturate(1.35)",
        WebkitBackdropFilter: "blur(30px) saturate(1.35)",
        boxShadow:
          "0 28px 68px rgba(25,70,170,0.07), 0 2px 6px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.75)",
      }}
    >
      <h1 className="text-[26px] font-semibold leading-tight text-slate-800">
        Welcome back
      </h1>
      <p className="mt-1.5 text-[14px] leading-relaxed text-slate-500">
        Sign in to track live authenticity scans.
      </p>

      <form className="mt-7 space-y-5" onSubmit={(e) => e.preventDefault()}>
        {/* Work Email */}
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-700">
            Work Email
          </label>
          <input
            type="email"
            placeholder="name@company.com"
            className="w-full rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3 text-[14px] text-slate-700 placeholder-slate-400 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200/50"
          />
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-700">
            Password
          </label>
          <input
            type="password"
            placeholder="Enter password"
            className="w-full rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3 text-[14px] text-slate-700 placeholder-slate-400 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200/50"
          />
        </div>

        {/* Remember / Forgot */}
        <div className="flex items-center justify-between text-[13px]">
          <label className="flex items-center gap-2 text-slate-600 select-none">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-blue-300"
            />
            Remember me
          </label>
          <button
            type="button"
            className="font-medium text-blue-600 transition-colors hover:text-blue-700"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3.5 text-[14px] font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30 hover:brightness-[1.04] active:scale-[0.98]"
        >
          Secure Login
        </button>
      </form>

      <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-400">
        Protected by adaptive policy controls and behavioral
        <br />
        anomaly detection.
      </p>

      {/* Sign up link */}
      <p className="mt-5 text-center text-[13px] text-slate-600">
        Don't have an account?{" "}
        <motion.button
          type="button"
          onClick={onSignupClick}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.12 }}
          className="font-medium text-blue-600 transition-colors hover:text-blue-700"
          aria-label="Open sign up form"
        >
          Sign up
        </motion.button>
      </p>
    </div>
  );
}
