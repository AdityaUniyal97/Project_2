"use client";

import { useEffect, useRef, useCallback } from "react";
import AnimatedCodePanel from "@/components/AnimatedCodePanel";
import { PANEL_CONFIGS } from "@/utils/panelData";

/* ────────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────────── */
interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/* ────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────── */
const rand = (min: number, max: number) => min + Math.random() * (max - min);

export default function BackgroundEngine() {
  const deepCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const panelWrapperRef = useRef<HTMLDivElement | null>(null);

  /* Smooth pointer values (lerped each frame) */
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  /* ── Canvas animation ────────────────────────────────────────── */
  const initCanvas = useCallback(() => {
    const deepCanvas = deepCanvasRef.current;
    const particleCanvas = particleCanvasRef.current;
    if (!deepCanvas || !particleCanvas) return () => {};

    const deepCtx = deepCanvas.getContext("2d", { alpha: true });
    const particleCtx = particleCanvas.getContext("2d", { alpha: true });
    if (!deepCtx || !particleCtx) return () => {};

    let width = 0;
    let height = 0;
    let dpr = 1;

    const particles: Particle[] = [];
    const nodes: Node[] = [];

    /* ── Build helpers ──────────────────────────────────────────── */
    const buildParticles = () => {
      particles.length = 0;
      const count = Math.min(60, Math.floor((width * height) / 28000));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: rand(0, width),
          y: rand(0, height),
          r: rand(0.6, 1.6),
          vx: rand(-0.03, 0.03),
          vy: rand(-0.025, 0.025),
          alpha: rand(0.06, 0.2),
        });
      }
    };

    const buildNodes = () => {
      nodes.length = 0;
      const count = Math.min(28, Math.floor((width * height) / 60000));
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: rand(0, width),
          y: rand(0, height),
          vx: rand(-0.04, 0.04),
          vy: rand(-0.035, 0.035),
        });
      }
    };

    /* ── Resize ─────────────────────────────────────────────────── */
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      for (const c of [deepCanvas, particleCanvas]) {
        c.width = Math.floor(width * dpr);
        c.height = Math.floor(height * dpr);
        c.style.width = `${width}px`;
        c.style.height = `${height}px`;
      }
      deepCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particleCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      buildParticles();
      buildNodes();
    };

    resize();

    /* ── Draw: grid (deep layer) ────────────────────────────────── */
    const drawGrid = (time: number) => {
      const step = 68;
      const ox = (time * 0.005) % step;
      const oy = (time * 0.006) % step;
      deepCtx.strokeStyle = "rgba(59,130,246,0.035)";
      deepCtx.lineWidth = 0.8;
      deepCtx.beginPath();
      for (let x = -step + ox; x < width + step; x += step) {
        deepCtx.moveTo(x, 0);
        deepCtx.lineTo(x, height);
      }
      for (let y = -step + oy; y < height + step; y += step) {
        deepCtx.moveTo(0, y);
        deepCtx.lineTo(width, y);
      }
      deepCtx.stroke();
    };

    /* ── Draw: neural network links ─────────────────────────────── */
    const drawNeuralLinks = () => {
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      }

      const linkDist = 160;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > linkDist) continue;
          const alpha = 0.06 * (1 - d / linkDist);
          deepCtx.beginPath();
          deepCtx.strokeStyle = `rgba(59,130,246,${alpha})`;
          deepCtx.lineWidth = 0.8;
          deepCtx.moveTo(a.x, a.y);
          deepCtx.lineTo(b.x, b.y);
          deepCtx.stroke();
        }
      }

      for (const n of nodes) {
        deepCtx.beginPath();
        deepCtx.fillStyle = "rgba(59,130,246,0.14)";
        deepCtx.arc(n.x, n.y, 1.5, 0, Math.PI * 2);
        deepCtx.fill();
      }
    };

    /* ── Draw: particles (mid layer) ────────────────────────────── */
    const drawParticles = () => {
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;
        particleCtx.beginPath();
        particleCtx.fillStyle = `rgba(59,130,246,${p.alpha})`;
        particleCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        particleCtx.fill();
      }
    };

    /* ── Frame loop ─────────────────────────────────────────────── */
    let rafId = 0;

    const frame = (time: number) => {
      const p = pointer.current;
      // Smooth lerp – very gentle (0.03) for premium feel
      p.x += (p.tx - p.x) * 0.03;
      p.y += (p.ty - p.y) * 0.03;

      // Parallax: deep canvas and particle canvas shift subtly
      deepCanvas.style.transform = `translate3d(${p.x * -1.5}px, ${p.y * -1}px, 0)`;
      particleCanvas.style.transform = `translate3d(${p.x * 2.5}px, ${p.y * 1.5}px, 0)`;

      // 3D perspective tilt on the panel wrapper (foreground layer)
      if (panelWrapperRef.current) {
        panelWrapperRef.current.style.transform = `rotateX(${-p.y * 0.8}deg) rotateY(${p.x * 1}deg)`;
      }

      deepCtx.clearRect(0, 0, width, height);
      particleCtx.clearRect(0, 0, width, height);

      drawGrid(time);
      drawNeuralLinks();
      drawParticles();

      rafId = requestAnimationFrame(frame);
    };

    /* ── Events ─────────────────────────────────────────────────── */
    const handleMove = (cx: number, cy: number) => {
      pointer.current.tx = (cx / width) * 2 - 1;
      pointer.current.ty = (cy / height) * 2 - 1;
    };
    const mouseHandler = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const touchHandler = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) handleMove(t.clientX, t.clientY);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", mouseHandler);
    window.addEventListener("touchmove", touchHandler, { passive: true });
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", mouseHandler);
      window.removeEventListener("touchmove", touchHandler);
    };
  }, []);

  useEffect(() => {
    const cleanup = initCanvas();
    return cleanup;
  }, [initCanvas]);

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* ── Base gradient fill ──────────────────────────────────── */}
      <div className="absolute inset-0 bg-hero-gradient" />

      {/* ── Radial ambient lights ────────────────────────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(59,130,246,0.12),transparent_42%),radial-gradient(circle_at_82%_60%,rgba(96,165,250,0.09),transparent_48%)]" />

      {/* ── Radial glow behind login card area ──────────────────── */}
      <div className="absolute left-1/2 top-1/2 h-[70vh] w-[60vw] -translate-x-[15%] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(147,197,253,0.18)_0%,rgba(147,197,253,0.05)_45%,transparent_72%)] blur-2xl lg:-translate-x-0 lg:left-[55%]" />

      {/* ── Noise texture overlay ────────────────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.04] noise-texture"
        aria-hidden="true"
      />

      {/* ── Deep layer: grid + neural links canvas ──────────────── */}
      <canvas
        ref={deepCanvasRef}
        className="absolute inset-0 z-0 opacity-40 will-change-transform"
        aria-hidden="true"
      />

      {/* ── Mid layer: particle canvas ──────────────────────────── */}
      <canvas
        ref={particleCanvasRef}
        className="absolute inset-0 z-[1] opacity-30 will-change-transform"
        aria-hidden="true"
      />

      {/* ── Foreground layer: code panels (3D perspective) ─────── */}
      <div
        className="absolute inset-0 z-[2] hidden overflow-hidden lg:block"
        style={{ perspective: "1400px", perspectiveOrigin: "50% 50%" }}
        aria-hidden="true"
      >
        <div
          ref={panelWrapperRef}
          className="relative h-full w-full will-change-transform"
          style={{ transformStyle: "preserve-3d" }}
        >
          {PANEL_CONFIGS.map((panel, index) => (
            <AnimatedCodePanel key={panel.id} panel={panel} delay={index * 0.25} />
          ))}
        </div>
      </div>
    </div>
  );
}
