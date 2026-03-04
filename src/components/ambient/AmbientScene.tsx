import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useParallax } from "../auth/useParallax";

export type AmbientVariant =
  | "student-overview"
  | "student-submit"
  | "student-review"
  | "student-challenge"
  | "teacher-overview"
  | "teacher-submissions"
  | "teacher-reports"
  | "teacher-viva"
  | "teacher-students"
  | "teacher-demo"
  | "teacher-settings";

interface AmbientSceneProps {
  variant: AmbientVariant;
  className?: string;
  debug?: boolean;
}

interface SceneStyle {
  gridSize: number;
  gridOpacity: number;
  vignetteOpacity: number;
  particleCount: number;
}

interface PanelAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
  driftX: number;
  driftY: number;
  blur: number;
  opacity: number;
  duration: number;
}

interface PanelNode extends PanelAnchor {
  delay: number;
}

interface ParticleNode {
  x: number;
  y: number;
  size: number;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
  opacity: number;
}

function cx(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRng(seed: string) {
  let state = hashString(seed) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 10000) / 10000;
  };
}

const SCENE_STYLES: Record<AmbientVariant, SceneStyle> = {
  "student-overview": { gridSize: 62, gridOpacity: 0.16, vignetteOpacity: 0.2, particleCount: 7 },
  "student-submit": { gridSize: 66, gridOpacity: 0.13, vignetteOpacity: 0.2, particleCount: 6 },
  "student-review": { gridSize: 56, gridOpacity: 0.17, vignetteOpacity: 0.24, particleCount: 8 },
  "student-challenge": { gridSize: 24, gridOpacity: 0.12, vignetteOpacity: 0.18, particleCount: 5 },
  "teacher-overview": { gridSize: 48, gridOpacity: 0.16, vignetteOpacity: 0.21, particleCount: 7 },
  "teacher-submissions": { gridSize: 58, gridOpacity: 0.14, vignetteOpacity: 0.22, particleCount: 6 },
  "teacher-reports": { gridSize: 54, gridOpacity: 0.15, vignetteOpacity: 0.24, particleCount: 7 },
  "teacher-viva": { gridSize: 60, gridOpacity: 0.14, vignetteOpacity: 0.2, particleCount: 6 },
  "teacher-students": { gridSize: 60, gridOpacity: 0.14, vignetteOpacity: 0.2, particleCount: 6 },
  "teacher-demo": { gridSize: 62, gridOpacity: 0.13, vignetteOpacity: 0.24, particleCount: 6 },
  "teacher-settings": { gridSize: 70, gridOpacity: 0.1, vignetteOpacity: 0.16, particleCount: 4 },
};

const PANEL_TEMPLATES: Record<string, PanelAnchor[]> = {
  analytics: [
    { x: -7, y: 6, width: 360, height: 136, rotate: -7, driftX: 20, driftY: 12, blur: 5, opacity: 0.28, duration: 17 },
    { x: 70, y: 4, width: 320, height: 124, rotate: 7, driftX: -18, driftY: 11, blur: 6, opacity: 0.24, duration: 19 },
    { x: -4, y: 74, width: 340, height: 140, rotate: -5, driftX: 14, driftY: -10, blur: 7, opacity: 0.23, duration: 20 },
    { x: 74, y: 70, width: 330, height: 128, rotate: 6, driftX: -15, driftY: -12, blur: 7, opacity: 0.24, duration: 18 },
  ],
  upload: [
    { x: -6, y: 12, width: 332, height: 120, rotate: -6, driftX: 16, driftY: 10, blur: 6, opacity: 0.24, duration: 18 },
    { x: 75, y: 16, width: 310, height: 116, rotate: 6, driftX: -15, driftY: 9, blur: 6, opacity: 0.23, duration: 20 },
    { x: 74, y: 66, width: 340, height: 126, rotate: 8, driftX: -14, driftY: -10, blur: 7, opacity: 0.25, duration: 19 },
    { x: -4, y: 74, width: 320, height: 120, rotate: -5, driftX: 15, driftY: -11, blur: 6, opacity: 0.23, duration: 21 },
  ],
  review: [
    { x: -7, y: 14, width: 340, height: 122, rotate: -7, driftX: 14, driftY: 8, blur: 6, opacity: 0.26, duration: 18 },
    { x: 74, y: 8, width: 350, height: 130, rotate: 8, driftX: -16, driftY: 10, blur: 6, opacity: 0.27, duration: 19 },
    { x: -5, y: 73, width: 330, height: 130, rotate: -6, driftX: 12, driftY: -9, blur: 7, opacity: 0.24, duration: 21 },
    { x: 72, y: 71, width: 350, height: 130, rotate: 7, driftX: -12, driftY: -10, blur: 7, opacity: 0.25, duration: 20 },
    { x: 38, y: -8, width: 290, height: 104, rotate: -2, driftX: 10, driftY: 8, blur: 7, opacity: 0.19, duration: 22 },
  ],
  coding: [
    { x: -8, y: 8, width: 340, height: 130, rotate: -8, driftX: 18, driftY: 11, blur: 5, opacity: 0.27, duration: 18 },
    { x: 74, y: 10, width: 320, height: 118, rotate: 8, driftX: -17, driftY: 10, blur: 6, opacity: 0.24, duration: 19 },
    { x: -5, y: 72, width: 360, height: 140, rotate: -6, driftX: 15, driftY: -10, blur: 7, opacity: 0.25, duration: 20 },
    { x: 72, y: 68, width: 320, height: 124, rotate: 7, driftX: -14, driftY: -9, blur: 7, opacity: 0.24, duration: 21 },
  ],
  command: [
    { x: -6, y: 10, width: 350, height: 130, rotate: -7, driftX: 14, driftY: 10, blur: 6, opacity: 0.25, duration: 18 },
    { x: 74, y: 10, width: 340, height: 126, rotate: 8, driftX: -16, driftY: 10, blur: 6, opacity: 0.24, duration: 19 },
    { x: -4, y: 72, width: 330, height: 126, rotate: -6, driftX: 13, driftY: -9, blur: 7, opacity: 0.23, duration: 20 },
    { x: 71, y: 70, width: 340, height: 128, rotate: 7, driftX: -12, driftY: -10, blur: 7, opacity: 0.24, duration: 20 },
  ],
  desk: [
    { x: -5, y: 16, width: 322, height: 120, rotate: -6, driftX: 12, driftY: 9, blur: 6, opacity: 0.24, duration: 18 },
    { x: 72, y: 10, width: 360, height: 132, rotate: 8, driftX: -13, driftY: 9, blur: 6, opacity: 0.26, duration: 19 },
    { x: 74, y: 66, width: 340, height: 130, rotate: 6, driftX: -11, driftY: -8, blur: 7, opacity: 0.24, duration: 20 },
    { x: -5, y: 74, width: 320, height: 124, rotate: -5, driftX: 12, driftY: -10, blur: 7, opacity: 0.23, duration: 21 },
  ],
  reports: [
    { x: -6, y: 10, width: 338, height: 124, rotate: -7, driftX: 13, driftY: 9, blur: 6, opacity: 0.24, duration: 18 },
    { x: 72, y: 6, width: 350, height: 132, rotate: 8, driftX: -14, driftY: 10, blur: 6, opacity: 0.25, duration: 19 },
    { x: -4, y: 74, width: 330, height: 126, rotate: -5, driftX: 12, driftY: -8, blur: 7, opacity: 0.24, duration: 20 },
    { x: 72, y: 72, width: 342, height: 128, rotate: 6, driftX: -12, driftY: -9, blur: 7, opacity: 0.24, duration: 21 },
  ],
  viva: [
    { x: -6, y: 16, width: 326, height: 122, rotate: -6, driftX: 12, driftY: 9, blur: 6, opacity: 0.24, duration: 19 },
    { x: 74, y: 14, width: 336, height: 126, rotate: 7, driftX: -13, driftY: 8, blur: 6, opacity: 0.24, duration: 20 },
    { x: -5, y: 72, width: 320, height: 126, rotate: -5, driftX: 10, driftY: -8, blur: 7, opacity: 0.22, duration: 21 },
    { x: 72, y: 70, width: 340, height: 128, rotate: 6, driftX: -11, driftY: -9, blur: 7, opacity: 0.23, duration: 22 },
  ],
  timeline: [
    { x: -6, y: 12, width: 332, height: 124, rotate: -7, driftX: 12, driftY: 9, blur: 6, opacity: 0.23, duration: 19 },
    { x: 72, y: 14, width: 342, height: 126, rotate: 8, driftX: -12, driftY: 10, blur: 6, opacity: 0.24, duration: 20 },
    { x: -4, y: 74, width: 326, height: 124, rotate: -5, driftX: 10, driftY: -8, blur: 7, opacity: 0.22, duration: 21 },
    { x: 72, y: 70, width: 340, height: 128, rotate: 6, driftX: -11, driftY: -9, blur: 7, opacity: 0.23, duration: 22 },
  ],
  browser: [
    { x: -6, y: 8, width: 340, height: 126, rotate: -6, driftX: 12, driftY: 9, blur: 6, opacity: 0.24, duration: 18 },
    { x: 70, y: 8, width: 360, height: 136, rotate: 8, driftX: -14, driftY: 10, blur: 6, opacity: 0.26, duration: 19 },
    { x: -4, y: 74, width: 338, height: 128, rotate: -5, driftX: 11, driftY: -8, blur: 7, opacity: 0.23, duration: 20 },
    { x: 72, y: 68, width: 350, height: 132, rotate: 7, driftX: -12, driftY: -9, blur: 7, opacity: 0.24, duration: 21 },
  ],
  calm: [
    { x: -5, y: 10, width: 320, height: 114, rotate: -5, driftX: 8, driftY: 6, blur: 7, opacity: 0.2, duration: 20 },
    { x: 74, y: 14, width: 316, height: 112, rotate: 6, driftX: -8, driftY: 6, blur: 7, opacity: 0.19, duration: 21 },
    { x: 74, y: 72, width: 320, height: 114, rotate: 5, driftX: -8, driftY: -6, blur: 8, opacity: 0.2, duration: 22 },
  ],
};

const SCENE_PANEL_KEY: Record<AmbientVariant, keyof typeof PANEL_TEMPLATES> = {
  "student-overview": "analytics",
  "student-submit": "upload",
  "student-review": "review",
  "student-challenge": "coding",
  "teacher-overview": "command",
  "teacher-submissions": "desk",
  "teacher-reports": "reports",
  "teacher-viva": "viva",
  "teacher-students": "timeline",
  "teacher-demo": "browser",
  "teacher-settings": "calm",
};

function createPanelNodes(variant: AmbientVariant, debug: boolean) {
  const template = PANEL_TEMPLATES[SCENE_PANEL_KEY[variant]];
  const rand = createSeededRng(`${variant}-panel-seed`);
  const opacityBoost = debug ? 1.35 : 1;

  return template.map<PanelNode>((anchor, index) => ({
    x: anchor.x + (rand() - 0.5) * 1.8,
    y: anchor.y + (rand() - 0.5) * 1.2,
    width: anchor.width,
    height: anchor.height,
    rotate: anchor.rotate + (rand() - 0.5) * 1.5,
    driftX: anchor.driftX + (rand() - 0.5) * 4,
    driftY: anchor.driftY + (rand() - 0.5) * 3,
    blur: anchor.blur,
    opacity: Math.min(0.86, anchor.opacity * opacityBoost),
    duration: anchor.duration + rand() * 1.2,
    delay: rand() * 1.4 + index * 0.12,
  }));
}

function createParticleNodes(variant: AmbientVariant, count: number, debug: boolean) {
  const rand = createSeededRng(`${variant}-particle-seed`);
  return Array.from({ length: count }, (_, index): ParticleNode => ({
    x: 4 + rand() * 92,
    y: 8 + rand() * 84,
    size: 2 + rand() * 3.6,
    driftX: -12 + rand() * 24,
    driftY: -9 + rand() * 18,
    duration: 18 + rand() * 7,
    delay: rand() * 4 + index * 0.03,
    opacity: (debug ? 0.24 : 0.14) + rand() * (debug ? 0.2 : 0.1),
  }));
}

function FloatingPanels({ nodes }: { nodes: PanelNode[] }) {
  return (
    <>
      {nodes.map((node, index) => (
        <motion.div
          key={`panel-${index}`}
          className="absolute rounded-[26px] border border-white/60 bg-gradient-to-br from-white/44 via-white/16 to-slate-200/10 shadow-[0_18px_48px_rgba(15,23,42,0.16)]"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            width: node.width,
            height: node.height,
            opacity: node.opacity,
            filter: `blur(${node.blur}px)`,
            transform: `perspective(900px) rotateX(8deg) rotateY(-6deg) rotate(${node.rotate}deg)`,
          }}
          animate={{
            x: [0, node.driftX, 0],
            y: [0, node.driftY, 0],
            rotate: [node.rotate, node.rotate + 1.2, node.rotate],
          }}
          transition={{
            repeat: Infinity,
            duration: node.duration,
            delay: node.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}

function DustParticles({ nodes }: { nodes: ParticleNode[] }) {
  return (
    <>
      {nodes.map((node, index) => (
        <motion.span
          key={`dust-${index}`}
          className="absolute rounded-full bg-white/80"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            width: node.size,
            height: node.size,
            opacity: node.opacity,
            filter: "blur(0.6px)",
          }}
          animate={{
            x: [0, node.driftX, 0],
            y: [0, node.driftY, 0],
            opacity: [node.opacity * 0.65, node.opacity, node.opacity * 0.65],
          }}
          transition={{
            repeat: Infinity,
            duration: node.duration,
            delay: node.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}

function BaseLayer({ variant, intensity }: { variant: AmbientVariant; intensity: number }) {
  const style = SCENE_STYLES[variant];
  return (
    <>
      <div
        className="absolute inset-0 bg-gradient-to-br from-white/34 via-white/9 to-slate-200/26"
        style={{ opacity: 0.5 * intensity }}
      />
      <div
        className="absolute inset-0"
        style={{
          opacity: style.gridOpacity * intensity,
          backgroundImage:
            "linear-gradient(to right, rgba(148,163,184,0.28) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.28) 1px, transparent 1px)",
          backgroundSize: `${style.gridSize}px ${style.gridSize}px`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          opacity: style.vignetteOpacity * intensity,
          background:
            "radial-gradient(circle at 5% 10%, rgba(15,23,42,0.2) 0%, transparent 40%), radial-gradient(circle at 95% 8%, rgba(15,23,42,0.18) 0%, transparent 42%), radial-gradient(circle at 95% 95%, rgba(15,23,42,0.2) 0%, transparent 44%), radial-gradient(circle at 8% 92%, rgba(15,23,42,0.16) 0%, transparent 40%)",
        }}
      />
      <div
        className="absolute -left-[10%] top-[8%] h-[42vh] w-[42vh] rounded-full blur-3xl"
        style={{
          opacity: 0.22 * intensity,
          background:
            "radial-gradient(circle, rgba(56,189,248,0.35) 0%, rgba(56,189,248,0.07) 58%, transparent 78%)",
        }}
      />
      <div
        className="absolute -right-[8%] bottom-[4%] h-[44vh] w-[44vh] rounded-full blur-3xl"
        style={{
          opacity: 0.2 * intensity,
          background:
            "radial-gradient(circle, rgba(148,163,184,0.34) 0%, rgba(148,163,184,0.08) 58%, transparent 78%)",
        }}
      />
    </>
  );
}

function StudentOverviewSignature() {
  return (
    <>
      <div className="absolute left-[5%] right-[7%] top-[10%] h-32 opacity-[0.42]">
        <svg viewBox="0 0 1000 180" className="h-full w-full" fill="none" aria-hidden>
          <motion.polyline
            points="0,130 120,108 232,116 364,88 502,96 648,70 796,82 920,56 1000,64"
            stroke="rgba(96,165,250,0.95)"
            strokeWidth="2.2"
            strokeLinecap="round"
            animate={{ pathLength: [0.2, 1, 0.2], opacity: [0.4, 0.9, 0.4] }}
            transition={{ repeat: Infinity, duration: 10.5, ease: "easeInOut" }}
          />
        </svg>
      </div>
      {[14, 28, 45, 63, 82].map((left, index) => (
        <motion.span
          key={`overview-dot-${left}`}
          className="absolute top-[20%] h-2.5 w-2.5 rounded-full bg-blue-200/80"
          style={{ left: `${left}%` }}
          animate={{ opacity: [0.35, 0.9, 0.35], scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 4 + index * 0.35, delay: index * 0.22 }}
        />
      ))}
      <div className="absolute left-[4%] bottom-[8%] flex h-16 items-end gap-1.5 opacity-[0.3]">
        {[24, 38, 20, 46, 34].map((height, index) => (
          <motion.div
            key={`overview-bar-${index}`}
            className="w-3 rounded-t-sm bg-gradient-to-t from-slate-300/60 to-blue-200/60"
            style={{ height }}
            animate={{ opacity: [0.4, 0.78, 0.4] }}
            transition={{ repeat: Infinity, duration: 5 + index * 0.2 }}
          />
        ))}
      </div>
    </>
  );
}

function StudentSubmitSignature() {
  return (
    <>
      <div className="absolute left-[8%] right-[10%] top-[17%] h-3 overflow-hidden rounded-full border border-white/45 bg-white/35 opacity-[0.48]">
        <motion.div
          className="absolute inset-y-0 w-44 bg-gradient-to-r from-transparent via-cyan-200/95 to-transparent"
          animate={{ x: ["-140%", "230%"] }}
          transition={{ repeat: Infinity, duration: 7.5, ease: "linear" }}
        />
      </div>
      <div className="absolute right-[8%] top-[24%] h-20 w-20 opacity-[0.34]">
        <svg viewBox="0 0 100 100" className="h-full w-full" fill="none" aria-hidden>
          <path
            d="M50 16V64M50 16L34 34M50 16L66 34M22 64H78V84H22V64Z"
            stroke="rgba(148,163,184,0.9)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="absolute left-[10%] bottom-[16%] flex gap-2 opacity-[0.34]">
        {[0, 1, 2, 3].map((block) => (
          <motion.div
            key={`packet-${block}`}
            className="h-5 w-9 rounded-md border border-white/45 bg-white/35"
            animate={{ y: [0, -5, 0], opacity: [0.35, 0.72, 0.35] }}
            transition={{ repeat: Infinity, duration: 4.8, delay: block * 0.25, ease: "easeInOut" }}
          />
        ))}
      </div>
    </>
  );
}

function StudentReviewSignature() {
  return (
    <>
      <div className="absolute right-[9%] top-[20%] h-40 w-40 opacity-[0.4]">
        {[164, 126, 88, 50].map((size, index) => (
          <motion.div
            key={`review-ring-${size}`}
            className="absolute rounded-full border border-cyan-200/70"
            style={{ width: size, height: size, left: 80 - size / 2, top: 80 - size / 2 }}
            animate={{ opacity: [0.25, 0.7, 0.25], scale: [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: 5.5 + index * 0.6, ease: "easeInOut" }}
          />
        ))}
      </div>
      <motion.div
        className="absolute left-[6%] right-[6%] top-[42%] h-[2px] bg-gradient-to-r from-transparent via-cyan-300/90 to-transparent"
        animate={{ y: [0, 130, 0], opacity: [0.2, 0.62, 0.2] }}
        transition={{ repeat: Infinity, duration: 8.5, ease: "easeInOut" }}
      />
      <div className="absolute left-[8%] top-[58%] h-20 w-[40%] opacity-[0.32]">
        <svg viewBox="0 0 480 120" className="h-full w-full" fill="none" aria-hidden>
          <path
            d="M12 94L118 70L214 80L300 52L386 62L468 34"
            stroke="rgba(125,211,252,0.9)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {[12, 118, 214, 300, 386, 468].map((x) => (
            <circle key={`review-node-${x}`} cx={x} cy={x === 12 ? 94 : x === 118 ? 70 : x === 214 ? 80 : x === 300 ? 52 : x === 386 ? 62 : 34} r="4" fill="rgba(191,219,254,0.95)" />
          ))}
        </svg>
      </div>
    </>
  );
}

function StudentChallengeSignature() {
  return (
    <>
      <motion.div
        className="absolute left-[6%] top-[22%] font-mono text-[86px] font-semibold text-slate-300/42"
        animate={{ y: [0, -7, 0], opacity: [0.2, 0.44, 0.2] }}
        transition={{ repeat: Infinity, duration: 7.2, ease: "easeInOut" }}
      >
        {"{}"}
      </motion.div>
      <motion.div
        className="absolute right-[11%] top-[46%] h-14 w-[2px] bg-cyan-100/80"
        animate={{ opacity: [0.16, 0.9, 0.16] }}
        transition={{ repeat: Infinity, duration: 1.3, ease: "linear" }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-28"
        style={{
          background:
            "linear-gradient(to top, rgba(15,23,42,0.2) 0%, rgba(15,23,42,0.08) 34%, rgba(15,23,42,0) 100%)",
          opacity: 0.45,
        }}
      />
    </>
  );
}

function TeacherOverviewSignature() {
  return (
    <>
      <motion.div
        className="absolute left-[8%] right-[8%] top-[20%] h-[2px] bg-gradient-to-r from-transparent via-blue-200/90 to-transparent"
        animate={{ x: ["-6%", "6%", "-6%"], opacity: [0.22, 0.55, 0.22] }}
        transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
      />
      <div className="absolute right-[8%] top-[12%] h-20 w-40 rounded-xl border border-white/45 bg-white/22 opacity-[0.32]" />
    </>
  );
}

function TeacherSubmissionsSignature() {
  return (
    <div className="absolute right-[7%] top-[18%] h-56 w-52 opacity-[0.38]">
      {[0, 1, 2].map((layer) => (
        <div
          key={`desk-layer-${layer}`}
          className="absolute w-full rounded-2xl border border-white/50 bg-white/20"
          style={{ top: layer * 12, left: layer * 10, height: 160 }}
        />
      ))}
      <motion.div
        className="absolute left-0 right-0 top-8 h-8 bg-gradient-to-r from-transparent via-cyan-200/90 to-transparent"
        animate={{ x: ["-120%", "140%"] }}
        transition={{ repeat: Infinity, duration: 6.4, ease: "linear" }}
      />
    </div>
  );
}

function TeacherReportsSignature() {
  return (
    <>
      <div className="absolute left-[7%] bottom-[12%] flex h-28 items-end gap-2 opacity-[0.36]">
        {[34, 52, 26, 60, 44].map((height, index) => (
          <motion.div
            key={`report-bar-${index}`}
            className="w-5 rounded-t-md bg-gradient-to-t from-slate-300/60 to-blue-200/70"
            style={{ height }}
            animate={{ opacity: [0.35, 0.85, 0.35] }}
            transition={{ repeat: Infinity, duration: 4.6 + index * 0.3, ease: "easeInOut" }}
          />
        ))}
      </div>
      <motion.svg
        viewBox="0 0 270 90"
        className="absolute right-[8%] top-[24%] h-24 w-64 opacity-[0.36]"
        fill="none"
      >
        <motion.polyline
          points="0,70 36,62 74,66 110,48 150,40 192,45 230,28 260,34"
          stroke="rgba(125,211,252,0.95)"
          strokeWidth="2"
          animate={{ pathLength: [0.2, 1, 0.2], opacity: [0.4, 0.9, 0.4] }}
          transition={{ repeat: Infinity, duration: 8.8, ease: "easeInOut" }}
        />
      </motion.svg>
    </>
  );
}

function TeacherVivaSignature() {
  return (
    <>
      <div className="absolute left-[10%] top-[24%] h-24 w-28 rounded-2xl border border-white/42 bg-white/14 opacity-[0.34]" />
      <div className="absolute left-[24%] top-[38%] h-16 w-24 rounded-2xl border border-white/38 bg-white/10 opacity-[0.3]" />
      <motion.div
        className="absolute left-[17%] top-[50%] h-[2px] w-[20%] bg-gradient-to-r from-cyan-200/0 via-cyan-200/90 to-cyan-200/0"
        animate={{ opacity: [0.25, 0.75, 0.25] }}
        transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut" }}
      />
      {[14, 28, 42].map((left, index) => (
        <motion.span
          key={`viva-node-${left}`}
          className="absolute top-[57%] h-2.5 w-2.5 rounded-full bg-cyan-200/80"
          style={{ left: `${left}%` }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.32, 0.88, 0.32] }}
          transition={{ repeat: Infinity, duration: 3.2 + index * 0.4, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

function TeacherStudentsSignature() {
  return (
    <>
      <div className="absolute left-[10%] top-[22%] h-[2px] w-[72%] bg-gradient-to-r from-cyan-200/0 via-cyan-200/72 to-cyan-200/0 opacity-[0.5]" />
      {[12, 27, 43, 58, 72].map((left, index) => (
        <motion.span
          key={`students-dot-${left}`}
          className="absolute top-[21.35%] h-3 w-3 rounded-full border border-blue-200/72 bg-white/70"
          style={{ left: `${left}%` }}
          animate={{ opacity: [0.34, 0.86, 0.34], scale: [1, 1.28, 1] }}
          transition={{ repeat: Infinity, duration: 4 + index * 0.3, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

function TeacherDemoSignature() {
  return (
    <>
      <div className="absolute left-[8%] top-[10%] h-9 w-[48%] rounded-xl border border-white/45 bg-white/16 opacity-[0.36]" />
      <div className="absolute left-[8%] top-[15%] h-72 w-[78%] rounded-2xl border border-white/38 bg-white/10 opacity-[0.3]" />
      <motion.div
        className="absolute left-[8%] top-[15%] h-72 w-[78%] rounded-2xl bg-gradient-to-b from-transparent via-cyan-100/22 to-transparent"
        animate={{ y: ["-8%", "8%", "-8%"], opacity: [0.18, 0.45, 0.18] }}
        transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
      />
    </>
  );
}

function TeacherSettingsSignature() {
  return (
    <motion.div
      className="absolute -left-[18%] top-[62%] h-20 w-[44%] rounded-full bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent blur-md"
      animate={{ x: [0, 44, 0], opacity: [0.16, 0.36, 0.16] }}
      transition={{ repeat: Infinity, duration: 11.5, ease: "easeInOut" }}
    />
  );
}

function renderSignature(variant: AmbientVariant) {
  if (variant === "student-overview") return <StudentOverviewSignature />;
  if (variant === "student-submit") return <StudentSubmitSignature />;
  if (variant === "student-review") return <StudentReviewSignature />;
  if (variant === "student-challenge") return <StudentChallengeSignature />;
  if (variant === "teacher-overview") return <TeacherOverviewSignature />;
  if (variant === "teacher-submissions") return <TeacherSubmissionsSignature />;
  if (variant === "teacher-reports") return <TeacherReportsSignature />;
  if (variant === "teacher-viva") return <TeacherVivaSignature />;
  if (variant === "teacher-students") return <TeacherStudentsSignature />;
  if (variant === "teacher-demo") return <TeacherDemoSignature />;
  return <TeacherSettingsSignature />;
}

export default function AmbientScene({ variant, className, debug = false }: AmbientSceneProps) {
  const sceneStyle = SCENE_STYLES[variant];
  const intensity = debug ? 1.48 : 1;

  const panelNodes = useMemo(() => createPanelNodes(variant, debug), [debug, variant]);
  const particleNodes = useMemo(
    () =>
      createParticleNodes(
        variant,
        sceneStyle.particleCount + (debug ? 2 : 0),
        debug,
      ),
    [debug, sceneStyle.particleCount, variant],
  );

  const parallax = useParallax();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const sceneX = useSpring(rawX, { stiffness: 30, damping: 26 });
  const sceneY = useSpring(rawY, { stiffness: 30, damping: 26 });

  const [reviewPulseCount, setReviewPulseCount] = useState(0);

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      const values = parallax.current;
      if (values) {
        rawX.set(values.x * (debug ? 18 : 12));
        rawY.set(values.y * (debug ? 14 : 9));
      }
      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [debug, parallax, rawX, rawY]);

  useEffect(() => {
    if (variant !== "student-review") return;

    const onPipelineStep = () => {
      setReviewPulseCount((count) => count + 1);
    };

    window.addEventListener("pg:review-step", onPipelineStep);
    return () => {
      window.removeEventListener("pg:review-step", onPipelineStep);
    };
  }, [variant]);

  return (
    <div
      className={cx("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      <motion.div className="absolute inset-0" style={{ x: sceneX, y: sceneY }}>
        <BaseLayer variant={variant} intensity={intensity} />
        <FloatingPanels nodes={panelNodes} />
        <DustParticles nodes={particleNodes} />
        {renderSignature(variant)}

        {variant === "student-review" && reviewPulseCount > 0 ? (
          <motion.div
            key={`review-pulse-${reviewPulseCount}`}
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 72% 32%, rgba(56,189,248,0.3) 0%, rgba(56,189,248,0.09) 32%, transparent 70%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, debug ? 0.3 : 0.14, 0] }}
            transition={{ duration: 1.05, ease: "easeOut" }}
          />
        ) : null}
      </motion.div>
    </div>
  );
}
