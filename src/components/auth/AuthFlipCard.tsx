import { useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import LoginCard from "./LoginCard";
import SignupCard from "./SignupCard";

export type AuthMode = "signin" | "signup";

interface Props {
  authMode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
}

const FLIP_TRANSITION = {
  type: "spring",
  stiffness: 170,
  damping: 24,
  mass: 0.9,
};

const HEIGHT_TRANSITION = {
  duration: 0.35,
  ease: "easeInOut" as const,
};

export default function AuthFlipCard({ authMode, onModeChange }: Props) {
  const signInRef = useRef<HTMLDivElement>(null);
  const signUpRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState(0);
  const isSignup = authMode === "signup";

  useLayoutEffect(() => {
    const activeFace = authMode === "signin" ? signInRef.current : signUpRef.current;
    if (!activeFace) return;
    setCardHeight(activeFace.offsetHeight);
  }, [authMode]);

  return (
    <section className="flip-perspective w-full max-w-[460px]">
      <motion.div
        className="relative w-full will-change-[height]"
        animate={{ height: cardHeight }}
        transition={HEIGHT_TRANSITION}
      >
        <motion.div
          className="flip-inner absolute inset-0 w-full"
          animate={{ rotateY: isSignup ? 180 : 0 }}
          transition={FLIP_TRANSITION}
        >
          <div
            className={`flip-face absolute left-0 top-0 w-full ${
              isSignup ? "pointer-events-none" : "pointer-events-auto"
            }`}
            aria-hidden={isSignup}
          >
            <div ref={signInRef}>
              <LoginCard onSignupClick={() => onModeChange("signup")} />
            </div>
          </div>

          <div
            className={`flip-face flip-back absolute left-0 top-0 w-full ${
              isSignup ? "pointer-events-auto" : "pointer-events-none"
            }`}
            aria-hidden={!isSignup}
          >
            <div ref={signUpRef}>
              <SignupCard onBackToLogin={() => onModeChange("signin")} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
