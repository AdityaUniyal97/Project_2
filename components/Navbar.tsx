import Link from "next/link";

const navItems = ["Home", "Features", "Blog", "Pricing"];

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-white/60 bg-white/40 backdrop-blur-xl">
      <nav className="mx-auto flex h-[74px] w-full max-w-7xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
          ProjectGuard AI
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <li key={item}>
              <Link
                href="#"
                className="group relative text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-blue-700"
              >
                <span>{item}</span>
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-blue-500 transition-all duration-300 group-hover:w-full" />
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <Link href="#" className="text-sm font-semibold text-slate-700 transition hover:text-blue-700">
            Login
          </Link>
          <Link
            href="#"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-blue-500"
          >
            Sign Up
          </Link>
        </div>
      </nav>
    </header>
  );
}
