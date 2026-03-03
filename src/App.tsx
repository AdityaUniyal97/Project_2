import { useState } from "react";
import TopNav from "./components/auth/TopNav";
import AnimatedBackground from "./components/auth/AnimatedBackground";
import AuthFlipCard, { type AuthMode } from "./components/auth/AuthFlipCard";
import { useParallax } from "./components/auth/useParallax";

export default function App() {
  const parallax = useParallax();
  const [authMode, setAuthMode] = useState<AuthMode>("signin");

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <AnimatedBackground parallax={parallax} />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[9] h-[180px]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(2,6,23,0.16) 0%, rgba(2,6,23,0.08) 38%, rgba(2,6,23,0) 100%)",
        }}
      />

      <TopNav
        authMode={authMode}
        onAuthClick={() =>
          setAuthMode((current) => (current === "signin" ? "signup" : "signin"))
        }
      />

      <main className="relative z-10 flex flex-1 items-start justify-end px-6 pb-14 pt-6 sm:px-16 sm:pt-10 lg:px-24">
        <AuthFlipCard authMode={authMode} onModeChange={setAuthMode} />
      </main>
    </div>
  );
}
