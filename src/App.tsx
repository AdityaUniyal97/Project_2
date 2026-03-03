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
