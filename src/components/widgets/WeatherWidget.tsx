"use client";

import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  CloudFog,
  ArrowUp,
  ArrowDown,
  type LucideIcon,
} from "lucide-react";
import { useJarvis } from "@/lib/store";
import { WidgetTile } from "./WidgetTile";

const ICONS: Record<string, LucideIcon> = {
  clear: Sun,
  cloud: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
  snow: Snowflake,
  fog: CloudFog,
};

export function WeatherWidget({ delay }: { delay?: number }) {
  const w = useJarvis((s) => s.data.weather);
  const Icon = ICONS[w.icon] ?? Sun;

  const temps = w.hourly.map((h) => h.tempC);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const span = Math.max(1, max - min);

  return (
    <WidgetTile title="Weather" widgetKey="weather" icon={Icon} delay={delay}>
      <div className="flex items-center gap-3">
        <Icon size={44} className="shrink-0 text-primary text-glow" strokeWidth={1.25} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-3xl font-bold text-ink text-glow tabular-nums">
              {w.tempC}°
            </span>
            <span className="font-heading text-sm text-ink-dim">{w.condition}</span>
          </div>
          <div className="truncate font-heading text-xs text-ink-dim">{w.location}</div>
        </div>
        <div className="shrink-0 text-right font-mono text-[11px]">
          <div className="flex items-center justify-end gap-1 text-accent">
            <ArrowUp size={11} />
            {w.highC}°
          </div>
          <div className="flex items-center justify-end gap-1 text-primary">
            <ArrowDown size={11} />
            {w.lowC}°
          </div>
        </div>
      </div>

      {/* hourly sparkline */}
      <div className="mt-3 flex items-end justify-between gap-1.5">
        {w.hourly.map((h) => {
          const pct = ((h.tempC - min) / span) * 100;
          return (
            <div key={h.time} className="flex flex-1 flex-col items-center gap-1">
              <span className="font-mono text-[9px] text-ink">{h.tempC}°</span>
              <div className="flex h-10 w-full items-end">
                <div
                  className="w-full rounded-sm bg-gradient-to-t from-primary/30 to-primary"
                  style={{ height: `${20 + pct * 0.8}%` }}
                />
              </div>
              <span className="font-mono text-[9px] text-ink-dim">{h.time.slice(0, 2)}</span>
            </div>
          );
        })}
      </div>
    </WidgetTile>
  );
}
