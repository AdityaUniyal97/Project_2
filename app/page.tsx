import BackgroundEngine from "@/components/BackgroundEngine";
import Navbar from "@/components/Navbar";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <BackgroundEngine />
      <Navbar />

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-74px)] w-full max-w-7xl flex-col justify-center gap-10 px-6 pb-12 pt-24 lg:flex-row lg:items-center lg:gap-14 lg:pt-28">
        {/* ── Left: Hero copy ──────────────────────────────────── */}
        <section className="max-w-2xl animate-fade-in-up">
          <p className="mb-3 inline-flex rounded-full border border-blue-200/80 bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700 backdrop-blur">
            Enterprise Source Integrity Platform
          </p>
          <h1 className="text-balance text-4xl font-bold leading-[0.95] text-slate-900 sm:text-5xl lg:text-6xl">
            Detect plagiarism risks before they reach production.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            ProjectGuard AI continuously cross-checks source history, repository patterns, and AI-generated artifacts to score originality in real time.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-[0_24px_60px_rgba(37,99,235,0.22)]">
              Start Free Trial
            </button>
            <button className="rounded-2xl border border-blue-200 bg-white/80 px-5 py-3 text-sm font-semibold text-blue-700 backdrop-blur transition-all duration-300 hover:bg-white hover:shadow-[0_8px_24px_rgba(37,99,235,0.08)]">
              See Product Tour
            </button>
          </div>
        </section>

        {/* ── Right: Login card with blur separation ───────────── */}
        <section className="relative w-full max-w-md animate-fade-in-up [animation-delay:200ms]">
          {/* Blur overlay behind the card for separation from bg */}
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-white/40 backdrop-blur-2xl" />
          {/* Soft radial glow */}
          <div className="absolute -inset-10 -z-20 rounded-full bg-[radial-gradient(circle,rgba(147,197,253,0.2)_0%,transparent_65%)]" />

          <div className="glass-card rounded-3xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-slate-900">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-600">Sign in to monitor live scan activity.</p>

            <form className="mt-6 grid gap-4">
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Work Email
                <input
                  type="email"
                  placeholder="name@company.com"
                  className="rounded-xl border border-blue-100 bg-white/95 px-3 py-2.5 outline-none transition-all duration-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Password
                <input
                  type="password"
                  placeholder="Enter password"
                  className="rounded-xl border border-blue-100 bg-white/95 px-3 py-2.5 outline-none transition-all duration-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <div className="mt-1 flex items-center justify-between text-sm text-slate-600">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="accent-blue-600" />
                  Remember me
                </label>
                <a href="#" className="font-medium text-blue-700 hover:text-blue-600">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                className="mt-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-[0_24px_60px_rgba(37,99,235,0.22)]"
              >
                Secure Login
              </button>
            </form>

            <p className="mt-4 text-xs text-slate-500">
              Protected by behavioral anomaly detection and adaptive policy controls.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
