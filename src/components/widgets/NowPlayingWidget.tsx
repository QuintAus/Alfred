"use client";

import { motion } from "motion/react";
import { Music, SkipBack, SkipForward, Pause, Play } from "lucide-react";
import { useJarvis } from "@/lib/store";
import { WidgetTile } from "./WidgetTile";

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export function NowPlayingWidget({ delay }: { delay?: number }) {
  const np = useJarvis((s) => s.data.nowPlaying);
  const elapsed = np.durationSec * np.progress;

  return (
    <WidgetTile
      title="Now Playing"
      widgetKey="nowPlaying"
      icon={Music}
      accent="var(--color-violet)"
      delay={delay}
    >
      <div className="flex items-center gap-3">
        {/* album art placeholder */}
        <div className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-violet/30 to-primary/20 ring-1 ring-primary/20">
          <Music size={22} className="text-primary/80" />
          {np.isPlaying && (
            <div className="absolute bottom-1 left-1 flex items-end gap-0.5">
              {[0, 1, 2, 3].map((i) => (
                <motion.span
                  key={i}
                  className="w-0.5 rounded-full bg-primary"
                  animate={{ height: [3, 10, 5, 9, 3] }}
                  transition={{
                    duration: 0.9,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.12,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate font-heading text-sm font-semibold text-ink">{np.track}</div>
          <div className="truncate text-xs text-ink-dim">{np.artist}</div>
          <div className="truncate text-[11px] text-ink-dim/70">{np.album}</div>
        </div>

        {/* controls (decorative in Phase 1) */}
        <div className="flex shrink-0 items-center gap-2 text-ink-dim">
          <SkipBack size={16} className="transition-colors hover:text-ink" />
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
            {np.isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
          </span>
          <SkipForward size={16} className="transition-colors hover:text-ink" />
        </div>
      </div>

      {/* progress */}
      <div className="mt-3">
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-violet"
            style={{ width: `${np.progress * 100}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[10px] text-ink-dim">
          <span>{fmt(elapsed)}</span>
          <span>{fmt(np.durationSec)}</span>
        </div>
      </div>
    </WidgetTile>
  );
}
