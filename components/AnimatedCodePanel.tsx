"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import { panelVariants } from "@/animations/panelVariants";
import type { PanelConfig } from "@/utils/panelData";

/* ────────────────────────────────────────────────────────────────
   Props
   ──────────────────────────────────────────────────────────────── */
interface AnimatedCodePanelProps {
  panel: PanelConfig;
  delay: number;
}

/* ────────────────────────────────────────────────────────────────
   Highlight flash classes (scan beam triggers these)
   ──────────────────────────────────────────────────────────────── */
const highlightClassMap = {
  verified: "bg-emerald-500/15 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.35)]",
  flagged: "bg-red-500/15 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.35)]",
} as const;

export default function AnimatedCodePanel({ panel, delay }: AnimatedCodePanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const beamRef = useRef<HTMLDivElement | null>(null);
  const similarityRef = useRef<HTMLSpanElement | null>(null);
  const statusRef = useRef<HTMLSpanElement | null>(null);
  const lineRefs = useRef<Array<HTMLSpanElement | null>>([]);

  /* Each line gets a different scan trigger point for organic feel */
  const triggerOffsets = useMemo(
    () => panel.lines.map(() => 28 + Math.random() * 44),
    [panel.lines]
  );

  /* ── Scan beam animation (pure rAF — no heavy libs) ──────────── */
  useEffect(() => {
    const panelEl = panelRef.current;
    const beamEl = beamRef.current;
    const similarityEl = similarityRef.current;
    const statusEl = statusRef.current;
    if (!panelEl || !beamEl || !similarityEl || !statusEl) return;

    let frameId = 0;
    let x = -16;
    let last = performance.now();
    let speed = 0.04 + Math.random() * 0.03; // slower than before
    let statusIdx = 0;

    const step = (now: number) => {
      const dt = Math.min(34, now - last);
      last = now;

      const pw = panelEl.clientWidth;
      x += speed * dt;
      beamEl.style.transform = `translateX(${x}px)`;

      // Line highlight triggers
      lineRefs.current.forEach((el, i) => {
        if (!el) return;
        const target = (pw * triggerOffsets[i]) / 100;
        if (Math.abs(x - target) < 5) {
          const kind = el.dataset.kind as "verified" | "flagged" | undefined;
          const cls = kind && highlightClassMap[kind];
          if (cls) {
            const classes = cls.split(" ");
            el.classList.add(...classes);
            setTimeout(() => el.classList.remove(...classes), 500);
          }
        }
      });

      // Reset sweep
      if (x > pw + 20) {
        x = -16;
        speed = 0.035 + Math.random() * 0.035;

        const sim = Math.max(62, Math.min(98, panel.similarity + Math.floor(Math.random() * 9) - 4));
        similarityEl.textContent = `Similarity: ${sim}%`;

        statusIdx = (statusIdx + 1) % panel.statusCycle.length;
        statusEl.textContent = panel.statusCycle[statusIdx];
        statusEl.classList.remove("opacity-60");
        statusEl.classList.add("opacity-100");
        setTimeout(() => {
          statusEl.classList.remove("opacity-100");
          statusEl.classList.add("opacity-60");
        }, 500);
      }

      frameId = requestAnimationFrame(step);
    };

    const delayTimer = window.setTimeout(() => {
      frameId = requestAnimationFrame(step);
    }, 400 + Math.random() * 800);

    return () => {
      window.clearTimeout(delayTimer);
      cancelAnimationFrame(frameId);
    };
  }, [panel.similarity, panel.statusCycle, triggerOffsets]);

  /* ── Depth-driven visual props ───────────────────────────────── */
  const scale = 0.75 + panel.depth * 0.3;            // far = 0.75, close = 1.05
  const depthBlur = Math.max(0, (0.6 - panel.depth) * 2.5); // far = blurry
  const zOffset = Math.round(panel.depth * 60);       // translateZ
  const opacity = 0.55 + panel.depth * 0.4;           // far = dim

  /* Floating animation amplitude: closer panels move more */
  const floatAmp = 2 + panel.depth * 3;

  return (
    <motion.section
      custom={delay}
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      className={`absolute ${panel.className}`}
      style={{ zIndex: Math.round(panel.depth * 10) }}
    >
      <motion.div
        ref={panelRef}
        className="glass-panel relative max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl p-3"
        style={{
          transformStyle: "preserve-3d",
          transform: `translateZ(${zOffset}px) scale(${scale})`,
          filter: depthBlur > 0 ? `blur(${depthBlur.toFixed(1)}px)` : undefined,
          opacity,
        }}
        /* Elegant slow float — Apple-style */
        animate={{
          y: [0, -floatAmp, 0],
          rotateX: [0, 0.3, 0],
          rotateY: [0, -0.35, 0],
        }}
        transition={{
          duration: 16 + panel.depth * 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay * 0.6,
        }}
      >
        {/* ── Ambient glow behind panel ─────────────────────────── */}
        <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-blue-400/8 blur-3xl" />

        {/* ── Gradient overlay for depth ────────────────────────── */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 via-white/8 to-blue-100/15" />

        {/* ── Noise texture for realism ─────────────────────────── */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.06] noise-texture" />

        {/* ── Header bar ────────────────────────────────────────── */}
        <header className="relative mb-2 flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="h-[7px] w-[7px] rounded-full bg-slate-300/80" />
          <span className="h-[7px] w-[7px] rounded-full bg-slate-300/80" />
          <span className="h-[7px] w-[7px] rounded-full bg-slate-300/80" />
          <span className="ml-1 mr-auto text-[11px] font-semibold text-slate-600">
            {panel.fileName}
          </span>
          <span
            ref={statusRef}
            className="rounded-full border border-blue-200/50 bg-blue-500/8 px-2 py-0.5 text-[9px] font-semibold text-blue-600 opacity-60 transition-opacity duration-500"
          >
            {panel.statusCycle[0]}
          </span>
        </header>

        {/* ── Code area with scan beam ──────────────────────────── */}
        <div className="relative overflow-hidden rounded-xl border border-white/25 bg-white/40 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
          {/* Scan beam — subtle, soft glow */}
          <div
            ref={beamRef}
            className="pointer-events-none absolute inset-y-0 left-0 w-[1.5px] animate-scan-pulse bg-gradient-to-b from-blue-200/15 via-blue-400/35 to-blue-200/15 shadow-[0_0_6px_rgba(59,130,246,0.18),0_0_14px_rgba(59,130,246,0.06)]"
          >
            <div className="absolute inset-y-0 -left-1 w-4 bg-gradient-to-r from-transparent via-blue-300/12 to-transparent blur-sm" />
          </div>

          <pre className="relative m-0 space-y-0.5 overflow-hidden font-mono text-[10px] leading-relaxed text-slate-600">
            {panel.lines.map((line, i) => (
              <span
                key={`${panel.id}-${i}`}
                ref={(el) => { lineRefs.current[i] = el; }}
                data-kind={line.kind}
                className="block overflow-hidden text-ellipsis whitespace-nowrap rounded-md px-1.5 py-0.5 transition-all duration-300"
              >
                {line.text}
              </span>
            ))}
          </pre>
        </div>

        {/* ── Footer metrics ────────────────────────────────────── */}
        <footer className="relative mt-1.5 flex items-center justify-between text-[10px]">
          <span className="text-slate-400">
            Originality: {Math.min(98, panel.similarity + 9)}%
          </span>
          <span ref={similarityRef} className="font-semibold text-red-400/80">
            Similarity: {panel.similarity}%
          </span>
        </footer>
      </motion.div>
    </motion.section>
  );
}
