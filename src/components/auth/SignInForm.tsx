import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface Props {
  onSwitchToSignup: () => void;
}

export default function SignInForm({ onSwitchToSignup }: Props) {
  return (
    <div className="flex h-full flex-col">
      <h1 className="text-[26px] font-semibold leading-tight text-slate-800">Welcome back</h1>
      <p className="mt-1.5 text-[14px] leading-relaxed text-slate-500">
        Sign in to track live authenticity scans.
      </p>

      <form className="mt-7 space-y-5" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Work Email</label>
          <input
            type="email"
            placeholder="name@company.com"
            className="w-full rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3 text-[14px] text-slate-700 placeholder-slate-400 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200/50"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Password</label>
          <input
            type="password"
            placeholder="Enter password"
            className="w-full rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3 text-[14px] text-slate-700 placeholder-slate-400 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200/50"
          />
        </div>

        <div className="flex items-center justify-between text-[13px]">
          <label className="flex items-center gap-2 select-none text-slate-600">
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

        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3.5 text-[14px] font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30 hover:brightness-[1.04] active:scale-[0.98]"
        >
          Secure Login
        </button>
      </form>

      <div className="mt-4">
        <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
          Demo Access
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link
            to="/student"
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200/80 bg-white/45 px-3 py-2.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-white/70"
          >
            Sign in as Student
          </Link>
          <Link
            to="/teacher"
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200/80 bg-white/45 px-3 py-2.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-white/70"
          >
            Sign in as Teacher
          </Link>
        </div>
      </div>

      <p className="mt-auto pt-6 text-center text-[11px] leading-relaxed text-slate-400">
        Protected by adaptive policy controls and behavioral
        <br />
        anomaly detection.
      </p>

      <p className="mt-5 text-center text-[13px] text-slate-600">
        Don&apos;t have an account?{" "}
        <motion.button
          type="button"
          onClick={onSwitchToSignup}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.12 }}
          className="font-medium text-blue-600 transition-colors hover:text-blue-700"
        >
          Sign up
        </motion.button>
      </p>
    </div>
  );
}
