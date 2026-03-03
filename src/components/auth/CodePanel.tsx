import { memo, useMemo } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, type RefObject } from "react";
import type { ParallaxValues } from "./useParallax";

/* ─── deterministic code-line generator ─── */
const CODE_LINES = [
  "function scanRepository(url) {",
  "  Checking repository…",
  "  Checking repositories.87",
  "  Checksetting → 0_0831…1089",
  "  Getting be const_config[1]",
  "  Cossing.be reactive e_constiles…",
  "  Checker posstie w/postschéol",
  "  import { analyzeCode } from './scan'",
  "  async function verify(hash) {",
  "  const hash = crypto.sha256(buf)",
  "  Match: 'Found!' → e_sleeeaable.del",
  "  await scanResult.push(data)",
  "  Analysing pyramids.def",
  "  driving_repositories",
  "  Checking → repository.def",
  "  await a_sandesh → recons1.def",
  "  diffuse pyramids.def",
  "  console.log(scanComplete)",
  "  e_c.alesssable.del",
  "  return { status: 'verified' }",
  "}",
];
const HIGHLIGHT_COLORS = [
  "text-emerald-500/80",
  "text-rose-500/70",
  "text-amber-500/70",
  "text-sky-500/70",
  "text-violet-500/70",
];

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface CodeLine {
  num: number;
  text: string;
  color: string;
  indent: number;
  isHighlight: boolean;
}

function generateLines(seed: number, count: number): CodeLine[] {
  const rng = seededRng(seed);
  return Array.from({ length: count }, (_, i) => ({
    num: 100 + Math.floor(rng() * 140) + i * 3,
    text: CODE_LINES[Math.floor(rng() * CODE_LINES.length)],
    color: HIGHLIGHT_COLORS[Math.floor(rng() * HIGHLIGHT_COLORS.length)],
    indent: Math.floor(rng() * 3),
    isHighlight: rng() > 0.65,
  }));
}

/* ─── panel configuration ─── */
export interface PanelConfig {
  id: number;
  x: string;
  y: string;
  width: number;
  height: number;
  blur: number;
  opacity: number;
  depth: number; // 0 = far, 1 = near
  rotate: number;
  seed: number;
  scanDelay: number;
  lineCount: number;
}

export const PANEL_CONFIGS: PanelConfig[] = [
  // ── near / clear (front layer) ──
  { id: 1, x: "1%",  y: "6%",  width: 370, height: 240, blur: 0.3, opacity: 0.9,  depth: 0.85, rotate: -1.5, seed: 101, scanDelay: 0,   lineCount: 8 },
  { id: 2, x: "16%", y: "28%", width: 350, height: 260, blur: 0.2, opacity: 0.92, depth: 0.9,  rotate: 0.8,  seed: 202, scanDelay: 2.5, lineCount: 9 },
  { id: 4, x: "0%",  y: "58%", width: 380, height: 270, blur: 0.4, opacity: 0.88, depth: 0.8,  rotate: 1.2,  seed: 404, scanDelay: 1.5, lineCount: 9 },
  // ── mid-depth ──
  { id: 3, x: "37%", y: "7%",  width: 320, height: 210, blur: 0.8, opacity: 0.75, depth: 0.5,  rotate: -1,   seed: 303, scanDelay: 5,   lineCount: 7 },
  { id: 5, x: "30%", y: "50%", width: 310, height: 210, blur: 1,   opacity: 0.70, depth: 0.45, rotate: -0.5, seed: 505, scanDelay: 4,   lineCount: 7 },
  { id: 7, x: "5%",  y: "80%", width: 330, height: 230, blur: 0.6, opacity: 0.78, depth: 0.55, rotate: -0.8, seed: 707, scanDelay: 6,   lineCount: 8 },
  // ── far / hazy (back layer) ──
  { id: 6, x: "52%", y: "34%", width: 290, height: 190, blur: 1.8, opacity: 0.52, depth: 0.2,  rotate: 1.2,  seed: 606, scanDelay: 3,   lineCount: 6 },
  { id: 8, x: "44%", y: "70%", width: 300, height: 200, blur: 1.5, opacity: 0.55, depth: 0.25, rotate: 0.5,  seed: 808, scanDelay: 3.5, lineCount: 6 },
];

/* ─── single code panel ─── */
interface CodePanelProps {
  config: PanelConfig;
  parallax: RefObject<ParallaxValues>;
}

const CodePanel = memo(function CodePanel({ config, parallax }: CodePanelProps) {
  const lines = useMemo(
    () => generateLines(config.seed, config.lineCount),
    [config.seed, config.lineCount],
  );

  const factor = config.depth * 20;
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const px = useSpring(rawX, { stiffness: 45, damping: 28 });
  const py = useSpring(rawY, { stiffness: 45, damping: 28 });

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const p = parallax.current;
      if (p) {
        rawX.set(p.x * factor);
        rawY.set(p.y * factor);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [parallax, rawX, rawY, factor]);

  return (
    <motion.div
      className="pointer-events-none absolute select-none"
      style={{
        left: config.x,
        top: config.y,
        width: config.width,
        height: config.height,
        x: px,
        y: py,
        rotate: config.rotate,
        opacity: config.opacity,
        filter: `blur(${config.blur}px)`,
        willChange: "transform",
      }}
    >
      {/* frosted glass card */}
      <div className="relative h-full w-full overflow-hidden rounded-xl border border-white/35 bg-white/[0.52] shadow-xl backdrop-blur-md">
        {/* header bar */}
        <div className="flex items-center gap-1.5 border-b border-slate-200/25 px-3.5 py-2">
          <span className="h-[7px] w-[7px] rounded-full bg-red-400/80" />
          <span className="h-[7px] w-[7px] rounded-full bg-yellow-400/80" />
          <span className="h-[7px] w-[7px] rounded-full bg-green-400/80" />
          <span className="ml-2 font-mono text-[9px] text-slate-400/70">
            scan_unit_panel-{config.id}
          </span>
          <span className="ml-auto rounded-full bg-sky-100/60 px-2 py-0.5 font-mono text-[9px] font-medium text-sky-600/90">
            Analyzing…
          </span>
        </div>

        {/* code lines */}
        <div className="space-y-[3px] px-3.5 py-2.5 font-mono text-[11px] leading-[1.6]">
          {lines.map((l, i) => (
            <div key={i} className="flex gap-2">
              <span className="w-8 shrink-0 text-right text-slate-400/60 select-none">
                {l.num}
              </span>
              <span
                className={l.isHighlight ? l.color : "text-slate-600/70"}
                style={{ paddingLeft: l.indent * 14 }}
              >
                {l.text}
              </span>
            </div>
          ))}
        </div>

        {/* horizontal scan beam */}
        <div
          className="scan-beam absolute left-0 h-[2px] w-full"
          style={{ animationDelay: `${config.scanDelay}s` }}
        />
      </div>
    </motion.div>
  );
});

export default CodePanel;
