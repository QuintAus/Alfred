"use client";

import { useEffect, useRef } from "react";
import { useJarvis } from "@/lib/store";
import type { JarvisStatus } from "@/lib/types";

/**
 * The reactive circular voice visualizer — the soul of the JARVIS feel.
 *
 * A ring of radial bars drawn on a canvas, overlaid on the arc reactor. Each
 * frame it reads the latest `status` + `inputLevel` straight from the store
 * (getState, so the rAF loop never goes stale) and shapes the ring:
 *   idle      – slow, shallow breathing
 *   listening – lively, organic motion (real mic amplitude in Phase 4)
 *   thinking  – low ring + a highlight arc sweeping around
 *   speaking  – strong rhythmic pulses (real TTS amplitude in Phase 4)
 *   error     – amber, jittery
 *
 * Phase 4 just sets `status` and pushes real amplitude into `inputLevel`; the
 * ring already prefers the real signal when present (max with the simulation).
 */
const BARS = 96;

/** Per-status simulated energy envelope (0..1) used until real audio exists. */
function simEnergy(status: JarvisStatus, t: number): number {
  switch (status) {
    case "listening":
      // continuous, conversational shimmer
      return 0.45 + 0.25 * Math.abs(Math.sin(t * 2.1)) + 0.12 * Math.sin(t * 5.3);
    case "speaking":
      // speech-like cadence: bursts with brief gaps
      return 0.5 + 0.45 * Math.pow(Math.abs(Math.sin(t * 3.1)), 0.6);
    case "thinking":
      return 0.18 + 0.06 * Math.sin(t * 8);
    case "error":
      return 0.4 + 0.3 * Math.abs(Math.sin(t * 9));
    case "idle":
    default:
      return 0.12 + 0.05 * Math.sin(t * 1.1);
  }
}

function palette(status: JarvisStatus) {
  if (status === "error") return { a: "#fb7185", b: "#fda4af" };
  if (status === "speaking") return { a: "#22d3ee", b: "#7dffff" };
  if (status === "thinking") return { a: "#38bdf8", b: "#a78bfa" };
  return { a: "#22d3ee", b: "#00d4ff" };
}

export function VoiceVisualizer({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let size = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = Math.min(canvas.clientWidth, canvas.clientHeight);
      canvas.width = Math.floor(size * dpr);
      canvas.height = Math.floor(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // smoothed bar values for fluid motion
    const vals = new Float32Array(BARS).fill(0);
    let raf = 0;
    const start = performance.now();

    const render = (now: number) => {
      const t = (now - start) / 1000;
      const { status, inputLevel } = useJarvis.getState();
      const { a, b } = palette(status);

      // prefer real amplitude (Phase 4) but never drop below the simulation
      const energy = Math.max(simEnergy(status, t), inputLevel);

      const cx = size / 2;
      const cy = size / 2;
      const baseR = size * 0.355; // sits just outside the reactor's outer ring
      const maxBar = size * 0.11;
      const minBar = size * 0.012;

      ctx.clearRect(0, 0, size, size);

      // rotating sweep highlight position (used for "thinking")
      const sweep = (t * 0.6) % 1;

      for (let i = 0; i < BARS; i++) {
        const frac = i / BARS;
        const ang = frac * Math.PI * 2 - Math.PI / 2;

        // organic shape: a few harmonics so the ring reads as one waveform
        const shape =
          0.55 * Math.sin(frac * Math.PI * 6 + t * 1.3) +
          0.3 * Math.sin(frac * Math.PI * 14 - t * 2.1) +
          0.15 * Math.sin(frac * Math.PI * 22 + t * 0.7);
        let target = energy * (0.6 + 0.4 * (shape * 0.5 + 0.5));

        if (status === "thinking") {
          // concentrate energy under a sweeping head
          const d = Math.abs(((frac - sweep + 1) % 1) - 0) ;
          const near = Math.min(d, 1 - d);
          target = 0.12 + 0.85 * Math.exp(-(near * near) / 0.0008);
        }

        // smooth toward target
        vals[i] += (target - vals[i]) * 0.25;
        const len = minBar + Math.max(0, vals[i]) * maxBar;

        const x1 = cx + Math.cos(ang) * baseR;
        const y1 = cy + Math.sin(ang) * baseR;
        const x2 = cx + Math.cos(ang) * (baseR + len);
        const y2 = cy + Math.sin(ang) * (baseR + len);

        const lvl = Math.min(1, vals[i]);
        ctx.strokeStyle = lvl > 0.6 ? b : a;
        ctx.globalAlpha = 0.35 + lvl * 0.65;
        ctx.lineWidth = Math.max(1.5, size * 0.006);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // faint base ring the bars grow out of
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = a;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden
      style={{ width: "100%", height: "100%" }}
    />
  );
}
