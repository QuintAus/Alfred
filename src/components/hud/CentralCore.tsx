"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useJarvis } from "@/lib/store";
import type { JarvisStatus } from "@/lib/types";
import { formatClock, formatDateLine } from "@/lib/utils";
import { ArcReactor } from "./ArcReactor";
import { VoiceVisualizer } from "./VoiceVisualizer";

const STATUS_META: Record<JarvisStatus, { label: string; color: string }> = {
  booting: { label: "INITIALIZING", color: "var(--color-primary)" },
  idle: { label: "STANDING BY", color: "var(--color-primary)" },
  listening: { label: "LISTENING", color: "var(--color-primary-bright)" },
  thinking: { label: "PROCESSING", color: "var(--color-violet)" },
  speaking: { label: "RESPONDING", color: "var(--color-primary-bright)" },
  error: { label: "FAULT", color: "var(--color-danger)" },
};

// Phase 1 demo: clicking the reactor cycles through states so the visualizer's
// reactivity is visible before any audio is wired up (Phase 4 replaces this).
const DEMO_CYCLE: JarvisStatus[] = ["idle", "listening", "thinking", "speaking"];

export function CentralCore() {
  const status = useJarvis((s) => s.status);
  const setStatus = useJarvis((s) => s.setStatus);

  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const meta = STATUS_META[status] ?? STATUS_META.idle;
  const clock = now ? formatClock(now) : { hms: "--:--:--", ampm: "" };
  const dateLine = now ? formatDateLine(now) : "";

  const cycleDemo = () => {
    const i = DEMO_CYCLE.indexOf(status);
    const next = DEMO_CYCLE[(i + 1) % DEMO_CYCLE.length];
    setStatus(next);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-5 select-none">
      {/* reactor + reactive ring */}
      <motion.button
        type="button"
        onClick={cycleDemo}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        whileTap={{ scale: 0.97 }}
        className="relative grid place-items-center outline-none cursor-pointer"
        style={{
          width: "min(46vh, 80vw, 460px)",
          height: "min(46vh, 80vw, 460px)",
        }}
        aria-label="Cycle JARVIS demo state"
        title="Click to cycle states (Phase 1 demo)"
      >
        {/* arc reactor sits at 70% so the visualizer ring orbits outside it */}
        <ArcReactor
          status={status}
          className="absolute h-[70%] w-[70%]"
        />
        {/* reactive voice ring fills the whole element */}
        <VoiceVisualizer className="absolute inset-0" />
      </motion.button>

      {/* clock */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="flex flex-col items-center gap-1"
      >
        <div className="flex items-baseline gap-2">
          <span className="font-display text-5xl font-bold tracking-[0.12em] text-ink text-glow tabular-nums sm:text-6xl">
            {clock.hms}
          </span>
        </div>
        <div className="font-heading text-sm tracking-[0.35em] text-ink-dim">
          {dateLine}
        </div>

        {/* status line */}
        <div className="mt-1 flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full animate-ring-breathe"
            style={{ backgroundColor: meta.color, boxShadow: `0 0 10px ${meta.color}` }}
          />
          <span
            className="font-mono text-xs tracking-[0.45em]"
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
