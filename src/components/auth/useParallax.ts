import { useEffect, useRef, useCallback } from "react";

export interface ParallaxValues {
  x: number;
  y: number;
}

/**
 * Zero-rerender mouse parallax hook.
 * Returns a ref whose `.current` holds { x, y } in [-1, 1].
 * Reads mousemove events only — no React state, no re-renders.
 */
export function useParallax() {
  const values = useRef<ParallaxValues>({ x: 0, y: 0 });

  const handleMove = useCallback((e: MouseEvent) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    values.current = {
      x: (e.clientX - cx) / cx,
      y: (e.clientY - cy) / cy,
    };
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, [handleMove]);

  return values;
}
