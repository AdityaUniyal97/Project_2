import { motion, useMotionValue, useSpring } from "framer-motion";
import { memo, useEffect, type RefObject } from "react";
import type { ParallaxValues } from "./useParallax";

interface Props {
  parallax: RefObject<ParallaxValues>;
}

const GridOverlay = memo(function GridOverlay({ parallax }: Props) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 35, damping: 28 });
  const y = useSpring(rawY, { stiffness: 35, damping: 28 });

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const p = parallax.current;
      if (p) {
        rawX.set(p.x * 5);
        rawY.set(p.y * 5);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [parallax, rawX, rawY]);

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-[1]"
      style={{ x, y }}
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="auth-grid"
            width="56"
            height="56"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 56 0 L 0 0 0 56"
              fill="none"
              stroke="rgba(148,180,220,0.07)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-grid)" />
      </svg>
    </motion.div>
  );
});

export default GridOverlay;
