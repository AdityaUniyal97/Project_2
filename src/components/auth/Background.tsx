import type { RefObject } from "react";
import type { ParallaxValues } from "./useParallax";
import GridOverlay from "./GridOverlay";
import Particles from "./Particles";
import CodePanel, { PANEL_CONFIGS } from "./CodePanel";

interface Props {
  parallax: RefObject<ParallaxValues>;
}

export default function Background({ parallax }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* ── base gradient ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#e6effd] via-[#ecf3ff] to-[#f0f4fb]" />

      {/* ── top-left fog glow ── */}
      <div
        className="absolute -left-[14%] -top-[8%] h-[75vh] w-[75vw] rounded-full opacity-65"
        style={{
          background:
            "radial-gradient(circle, rgba(175,210,255,0.5) 0%, rgba(215,230,255,0.18) 50%, transparent 80%)",
        }}
      />

      {/* ── center glow ── */}
      <div
        className="absolute left-[18%] top-[22%] h-[65vh] w-[65vw] rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(circle, rgba(195,220,255,0.38) 0%, rgba(225,240,255,0.12) 55%, transparent 80%)",
        }}
      />

      {/* ── bottom-right fade ── */}
      <div
        className="absolute -bottom-[8%] -right-[8%] h-[55vh] w-[55vw] rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(185,215,255,0.42) 0%, rgba(220,235,255,0.1) 60%, transparent 85%)",
        }}
      />

      {/* ── soft vignette ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(200,215,240,0.32) 100%)",
        }}
      />

      {/* ── grid ── */}
      <GridOverlay parallax={parallax} />

      {/* ── code panels ── */}
      <div className="absolute inset-0 z-[2]">
        {PANEL_CONFIGS.map((cfg) => (
          <CodePanel key={cfg.id} config={cfg} parallax={parallax} />
        ))}
      </div>

      {/* ── dust particles ── */}
      <Particles count={80} />
    </div>
  );
}
