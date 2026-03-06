import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export type SidebarVisualPreset = "overview" | "submit" | "aiReview" | "liveCoding" | "account";

interface SidebarVisualProps {
  preset: SidebarVisualPreset;
  className?: string;
}

const PRESET_BG: Record<SidebarVisualPreset, string> = {
  overview: "from-blue-100/55 via-cyan-100/35 to-slate-100/35",
  submit: "from-sky-100/55 via-blue-100/35 to-slate-100/35",
  aiReview: "from-indigo-100/55 via-blue-100/35 to-slate-100/35",
  liveCoding: "from-cyan-100/55 via-blue-100/35 to-slate-100/35",
  account: "from-slate-100/60 via-blue-100/35 to-cyan-100/30",
};

export default function SidebarVisual({ preset, className = "" }: SidebarVisualProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none relative isolate overflow-hidden ${className}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${PRESET_BG[preset]}`} />
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.14)_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(255,255,255,0.5),transparent_40%),radial-gradient(circle_at_78%_82%,rgba(59,130,246,0.2),transparent_48%)]" />

      {reduceMotion ? (
        <StaticVisual />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={preset}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.015 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <PresetScene preset={preset} />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function StaticVisual() {
  return (
    <div className="absolute inset-0">
      <div className="absolute left-[14%] top-[16%] h-20 w-20 rounded-full border border-blue-300/35 bg-white/35 blur-[1px]" />
      <div className="absolute right-[15%] top-[33%] h-16 w-16 rounded-full border border-cyan-300/35 bg-white/30 blur-[1px]" />
      <div className="absolute bottom-[12%] left-[20%] right-[12%] h-20 rounded-2xl border border-white/35 bg-white/20" />
    </div>
  );
}

function PresetScene({ preset }: { preset: SidebarVisualPreset }) {
  if (preset === "overview") return <OverviewScene />;
  if (preset === "submit") return <SubmitScene />;
  if (preset === "aiReview") return <AiReviewScene />;
  if (preset === "liveCoding") return <LiveCodingScene />;
  return <AccountScene />;
}

function OverviewScene() {
  return (
    <div className="absolute inset-0">
      {[0, 1, 2, 3].map((index) => (
        <motion.div
          key={`overview-orb-${index}`}
          className="absolute rounded-full border border-white/45 bg-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
          style={{
            width: [62, 48, 72, 40][index],
            height: [62, 48, 72, 40][index],
            left: ["12%", "63%", "31%", "74%"][index],
            top: ["18%", "26%", "58%", "72%"][index],
          }}
          animate={{ y: [0, -10, 0], x: [0, 4, 0] }}
          transition={{ duration: 8 + index, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <motion.div
        className="absolute inset-x-[14%] bottom-[10%] h-20 rounded-2xl border border-white/40 bg-white/18"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function SubmitScene() {
  return (
    <div className="absolute inset-0">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={`submit-card-${index}`}
          className="absolute left-1/2 h-16 w-28 -translate-x-1/2 rounded-xl border border-white/45 bg-white/30"
          style={{ top: `${56 - index * 12}%` }}
          animate={{ y: [0, -7, 0], opacity: [0.45, 0.85, 0.45] }}
          transition={{ duration: 2.8, delay: index * 0.35, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <motion.div
        className="absolute left-1/2 top-[14%] h-28 w-0.5 -translate-x-1/2 bg-gradient-to-b from-blue-300/0 via-blue-400/75 to-blue-300/0"
        animate={{ scaleY: [0.7, 1.12, 0.7] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-1/2 top-[10%] h-0 w-0 -translate-x-1/2 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent border-b-blue-400/70"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function AiReviewScene() {
  const nodePositions = [
    { x: 18, y: 22 },
    { x: 44, y: 34 },
    { x: 72, y: 24 },
    { x: 30, y: 64 },
    { x: 62, y: 70 },
  ];

  return (
    <div className="absolute inset-0">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sidebar-pipe-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59,130,246,0.05)" />
            <stop offset="50%" stopColor="rgba(59,130,246,0.55)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0.05)" />
          </linearGradient>
        </defs>
        {[
          "18,22 44,34 72,24",
          "44,34 30,64 62,70",
          "18,22 30,64",
          "72,24 62,70",
        ].map((points, index) => (
          <motion.polyline
            key={`pipeline-line-${index}`}
            points={points}
            fill="none"
            stroke="url(#sidebar-pipe-line)"
            strokeWidth="0.9"
            initial={{ pathLength: 0.2, opacity: 0.35 }}
            animate={{ pathLength: [0.2, 1, 0.2], opacity: [0.35, 0.8, 0.35] }}
            transition={{ duration: 4 + index, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </svg>

      {nodePositions.map((node, index) => (
        <motion.div
          key={`pipeline-node-${index}`}
          className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-300/60 bg-white/70"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.55, 0.95, 0.55] }}
          transition={{ duration: 2.2 + index * 0.22, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      <motion.div
        className="absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-blue-300/20 to-transparent"
        animate={{ x: ["-25%", "145%"] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

function LiveCodingScene() {
  return (
    <div className="absolute inset-0">
      <div className="absolute left-[14%] right-[14%] top-[18%] rounded-xl border border-white/40 bg-slate-900/18 p-3">
        {[0, 1, 2, 3, 4].map((line) => (
          <motion.div
            key={`code-line-${line}`}
            className="mb-2 h-1.5 rounded-full bg-blue-300/45 last:mb-0"
            style={{ width: `${84 - line * 12}%` }}
            animate={{ opacity: [0.3, 0.85, 0.3] }}
            transition={{ duration: 1.8 + line * 0.25, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
      <motion.div
        className="absolute left-[25%] top-[64%] h-7 w-0.5 rounded-full bg-cyan-400/80"
        animate={{ opacity: [0.15, 1, 0.15] }}
        transition={{ duration: 1.05, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-[14%] right-[14%] top-[72%] h-10 rounded-xl border border-white/35 bg-white/18"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function AccountScene() {
  return (
    <div className="absolute inset-0">
      <div className="absolute left-1/2 top-[46%] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/45 bg-white/22" />
      <motion.div
        className="absolute left-1/2 top-[46%] h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-300/45"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute left-1/2 top-[46%] h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/35"
        animate={{ rotate: -360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute left-1/2 top-[24%] h-3 w-3 -translate-x-1/2 rounded-full bg-blue-400/75"
        animate={{ y: [0, 3, 0], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-[26%] top-[72%] h-14 w-28 rounded-full border border-white/35 bg-white/20"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
