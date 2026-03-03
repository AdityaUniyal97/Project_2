import { memo, useMemo, useRef, type RefObject } from "react";
import type { ParallaxValues } from "./useParallax";
import GridOverlay from "./GridOverlay";
import Particles from "./Particles";
import CodePanel, { type PanelConfig } from "./CodePanel";

interface Props {
  parallax: RefObject<ParallaxValues>;
}

const STABLE_PANEL_SEED = 20260303;

const PANEL_BLUEPRINTS = [
  { x: 1, y: 6, width: 370, height: 240, depth: 0.85, scanDelay: 0, lineCount: 8 },
  { x: 16, y: 28, width: 350, height: 260, depth: 0.9, scanDelay: 2.5, lineCount: 9 },
  { x: 0, y: 58, width: 380, height: 270, depth: 0.8, scanDelay: 1.5, lineCount: 9 },
  { x: 37, y: 7, width: 320, height: 210, depth: 0.5, scanDelay: 5, lineCount: 7 },
  { x: 30, y: 50, width: 310, height: 210, depth: 0.45, scanDelay: 4, lineCount: 7 },
  { x: 5, y: 80, width: 330, height: 230, depth: 0.55, scanDelay: 6, lineCount: 8 },
  { x: 52, y: 34, width: 290, height: 190, depth: 0.2, scanDelay: 3, lineCount: 6 },
  { x: 44, y: 70, width: 300, height: 200, depth: 0.25, scanDelay: 3.5, lineCount: 6 },
] as const;

function seededRng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generatePanels(seed: number): PanelConfig[] {
  const rng = seededRng(seed);
  return PANEL_BLUEPRINTS.map((panel, index) => {
    const blur = Number((0.2 + (1 - panel.depth) * 1.8 + rng() * 0.15).toFixed(2));
    const opacity = Number((0.45 + panel.depth * 0.5 + rng() * 0.04).toFixed(2));
    const rotate = Number(((rng() - 0.5) * 3.2).toFixed(2));
    return {
      id: index + 1,
      x: `${panel.x}%`,
      y: `${panel.y}%`,
      width: panel.width,
      height: panel.height,
      blur,
      opacity,
      depth: panel.depth,
      rotate,
      seed: Math.floor(rng() * 10000) + 100,
      scanDelay: panel.scanDelay,
      lineCount: panel.lineCount,
    };
  });
}

const AnimatedBackground = memo(function AnimatedBackground({ parallax }: Props) {
  const seedRef = useRef(STABLE_PANEL_SEED);
  const panelConfigs = useMemo(() => generatePanels(seedRef.current), []);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#e6effd] via-[#ecf3ff] to-[#f0f4fb]" />

      <div
        className="absolute -left-[14%] -top-[8%] h-[75vh] w-[75vw] rounded-full opacity-65"
        style={{
          background:
            "radial-gradient(circle, rgba(175,210,255,0.5) 0%, rgba(215,230,255,0.18) 50%, transparent 80%)",
        }}
      />
      <div
        className="absolute left-[18%] top-[22%] h-[65vh] w-[65vw] rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(circle, rgba(195,220,255,0.38) 0%, rgba(225,240,255,0.12) 55%, transparent 80%)",
        }}
      />
      <div
        className="absolute -bottom-[8%] -right-[8%] h-[55vh] w-[55vw] rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(185,215,255,0.42) 0%, rgba(220,235,255,0.1) 60%, transparent 85%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(200,215,240,0.32) 100%)",
        }}
      />

      <GridOverlay parallax={parallax} />

      <div className="absolute inset-0 z-[2]">
        {panelConfigs.map((config) => (
          <CodePanel key={config.id} config={config} parallax={parallax} />
        ))}
      </div>

      <Particles count={80} />
    </div>
  );
});

export default AnimatedBackground;
