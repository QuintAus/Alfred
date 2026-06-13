"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArcReactor } from "./ArcReactor";

const LINES = [
  "Calibrating arc reactor core",
  "Loading neural interface",
  "Mounting widget subsystems",
  "Establishing secure uplink",
  "Synchronizing personal data streams",
  "Engaging voice matrix",
];

const STEP_MS = 340;
const HOLD_MS = 900;

/**
 * Cinematic boot-up overlay. Reveals system-check lines, powers up a small arc
 * reactor, fills a progress bar, then calls `onComplete`. Click anywhere to skip.
 */
export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(0);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onComplete();
  };

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setCount(i + 1), (i + 1) * STEP_MS));
    });
    timers.push(setTimeout(finish, LINES.length * STEP_MS + HOLD_MS));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalSec = (LINES.length * STEP_MS) / 1000;
  const allDone = count >= LINES.length;

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-base"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      onClick={finish}
      role="status"
      aria-label="JARVIS booting"
    >
      <div className="hud-grid pointer-events-none absolute inset-0 opacity-60" />

      <div className="relative flex w-[min(90vw,520px)] flex-col items-center gap-6 px-6">
        {/* powering-up reactor */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0, filter: "blur(8px)" }}
          animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="h-36 w-36"
        >
          <ArcReactor status="booting" className="h-full w-full" />
        </motion.div>

        {/* wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center"
        >
          <div className="font-display text-2xl font-black tracking-[0.4em] text-ink text-glow">
            J.A.R.V.I.S.
          </div>
          <div className="mt-1 font-heading text-[10px] tracking-[0.4em] text-ink-dim">
            INITIALIZING SYSTEMS
          </div>
        </motion.div>

        {/* progress bar */}
        <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-dim via-primary to-primary-bright"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: totalSec, ease: "easeInOut" }}
          />
        </div>

        {/* boot log */}
        <div className="h-36 w-full font-mono text-xs">
          {LINES.slice(0, count).map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center justify-between py-0.5"
            >
              <span className="text-ink-dim">
                <span className="text-primary">›</span> {line}…
              </span>
              <span className="text-success">OK</span>
            </motion.div>
          ))}
          {allDone && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-center font-heading text-sm tracking-[0.4em] text-primary text-glow"
            >
              ALL SYSTEMS ONLINE
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
