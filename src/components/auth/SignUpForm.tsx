import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";

import { getDashboardPathForRole, register, type UserRole } from "../../lib/authClient";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface Props {
  onSwitchToSignin: () => void;
}

export default function SignUpForm({ onSwitchToSignin }: Props) {
  const [userType, setUserType] = useState<UserRole>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError("");
    setSubmitting(true);
    setIsSuccess(false);

    try {
      const response = await register({ name, email, password, role: userType });
      setIsSuccess(true);
      setUser(response.user);
      setTimeout(() => {
        const redirectPath = getDashboardPathForRole(response.user.role);
        navigate(redirectPath);
      }, 500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <h1 className="text-[26px] font-semibold leading-tight text-slate-800">Create Account</h1>
      <p className="mt-1.5 text-[14px] leading-relaxed text-slate-500">
        Sign up to start tracking authenticity scans.
      </p>

      <div className="mt-6 flex gap-2 rounded-xl bg-slate-100/60 p-1">
        <motion.button
          type="button"
          onClick={() => setUserType("student")}
          whileTap={{ scale: 0.985 }}
          className={`flex-1 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-all ${
            userType === "student"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          Sign up as Student
        </motion.button>
        <motion.button
          type="button"
          onClick={() => setUserType("teacher")}
          whileTap={{ scale: 0.985 }}
          className={`flex-1 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-all ${
            userType === "teacher"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          Sign up as Teacher
        </motion.button>
      </div>

      <form
        className="mt-6 flex-1 space-y-4 overflow-y-auto pr-1"
        onSubmit={handleSubmit}
      >
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Full Name</label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            required
            className="w-full rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3 text-[14px] text-slate-700 placeholder-slate-400 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200/50 disabled:opacity-70"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-700">
            Email Address
          </label>
          <input
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            required
            className="w-full rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3 text-[14px] text-slate-700 placeholder-slate-400 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200/50 disabled:opacity-70"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Password</label>
          <input
            type="password"
            placeholder="Create a strong password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            required
            minLength={8}
            className="w-full rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3 text-[14px] text-slate-700 placeholder-slate-400 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200/50 disabled:opacity-70"
          />
        </div>

        <div className="flex items-start gap-2 text-[13px]">
          <input
            type="checkbox"
            id="terms"
            disabled={submitting}
            required
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-blue-300"
          />
          <label htmlFor="terms" className="select-none text-slate-600">
            I agree to the Terms of Service and Privacy Policy
          </label>
        </div>

        <motion.button
          type="submit"
          disabled={submitting}
          whileTap={{ scale: 0.975 }}
          animate={
            isSuccess
              ? { scale: [1, 1.03, 1], boxShadow: "0 0 0 8px rgba(34,197,94,0.16)" }
              : { scale: 1, boxShadow: "0 8px 24px rgba(59,130,246,0.25)" }
          }
          transition={{ duration: 0.3 }}
          className={`w-full rounded-xl py-3.5 text-[14px] font-semibold text-white transition-all hover:brightness-[1.04] disabled:opacity-80 disabled:cursor-not-allowed ${
            isSuccess
              ? "bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-md shadow-emerald-500/30"
              : "bg-gradient-to-r from-blue-600 to-blue-500 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]"
          }`}
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
                <path
                  d="M22 12a10 10 0 00-10-10"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
              Creating...
            </span>
          ) : isSuccess ? (
            <span className="inline-flex items-center gap-2">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 7L10 17L4 11"
                  stroke="white"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Success! Redirecting...
            </span>
          ) : (
            "Create Account"
          )}
        </motion.button>
      </form>

      <p className="mt-5 text-center text-[13px] text-slate-600">
        Already have an account?{" "}
        <motion.button
          type="button"
          onClick={onSwitchToSignin}
          disabled={submitting}
          whileTap={{ scale: 0.97 }}
          className="font-medium text-blue-600 transition-colors hover:text-blue-700 disabled:opacity-70"
        >
          Sign in
        </motion.button>
      </p>
    </div>
  );
}
