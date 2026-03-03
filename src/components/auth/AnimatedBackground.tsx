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
      <div className="absolute inset-0 bg-gradient-to-br from-[#f3f5f8] via-[#f8fafc] to-[#edf1f5]" />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 52% 38%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.45) 42%, transparent 78%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(128deg, rgba(255,255,255,0.62) 0%, rgba(226,232,240,0.22) 52%, rgba(2,6,23,0.1) 100%)",
        }}
      />
      <div
        className="absolute -right-[6%] top-1/2 h-[52vh] w-[40vw] min-w-[320px] -translate-y-1/2 rounded-full opacity-45 blur-[80px]"
        style={{
          background:
            "radial-gradient(circle, rgba(15,23,42,0.2) 0%, rgba(15,23,42,0.07) 44%, transparent 76%)",
        }}
      />
      <div
        className="absolute -left-[16%] top-[18%] h-[62vh] w-[58vw] rounded-full opacity-30 blur-[86px]"
        style={{
          background:
            "radial-gradient(circle, rgba(15,23,42,0.14) 0%, rgba(15,23,42,0.04) 48%, transparent 78%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 0% 0%, rgba(2,6,23,0.12) 0%, transparent 36%),
            radial-gradient(circle at 100% 0%, rgba(2,6,23,0.1) 0%, transparent 34%),
            radial-gradient(circle at 100% 100%, rgba(2,6,23,0.13) 0%, transparent 38%),
            radial-gradient(circle at 0% 100%, rgba(2,6,23,0.12) 0%, transparent 36%)
          `,
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
