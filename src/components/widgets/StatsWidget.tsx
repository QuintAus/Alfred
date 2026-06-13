"use client";

import { Activity } from "lucide-react";
import { useJarvis } from "@/lib/store";
import { WidgetTile } from "./WidgetTile";

const ACCENT: Record<string, string> = {
  cyan: "var(--color-primary)",
  amber: "var(--color-accent)",
  green: "var(--color-success)",
};

export function StatsWidget({ delay }: { delay?: number }) {
  const stats = useJarvis((s) => s.data.stats);

  return (
    <WidgetTile title="Quick Stats" widgetKey="stats" icon={Activity} delay={delay}>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => {
          const accent = ACCENT[s.accent ?? "cyan"];
          return (
            <div
              key={s.id}
              className="relative overflow-hidden rounded-lg border border-primary/10 bg-white/[0.02] px-3 py-2.5"
            >
              <div
                className="absolute left-0 top-0 h-full w-0.5"
                style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }}
              />
              <div className="flex items-baseline gap-1">
                <span
                  className="font-display text-2xl font-bold tabular-nums"
                  style={{ color: accent }}
                >
                  {s.value}
                </span>
                {s.hint && <span className="text-[10px] text-ink-dim">{s.hint}</span>}
              </div>
              <div className="font-heading text-[11px] uppercase tracking-[0.2em] text-ink-dim">
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
    </WidgetTile>
  );
}
