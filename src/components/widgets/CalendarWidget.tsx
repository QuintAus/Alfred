"use client";

import { CalendarDays, MapPin, Users } from "lucide-react";
import { useJarvis } from "@/lib/store";
import { cn, prettyTime } from "@/lib/utils";
import { WidgetTile } from "./WidgetTile";

const ACCENT: Record<string, string> = {
  cyan: "var(--color-primary)",
  amber: "var(--color-accent)",
  violet: "var(--color-violet)",
  green: "var(--color-success)",
};

export function CalendarWidget({ delay }: { delay?: number }) {
  const events = useJarvis((s) => s.data.calendar);
  const highlighted = useJarvis((s) => s.highlightedIds);

  return (
    <WidgetTile
      title="Today's Agenda"
      widgetKey="calendar"
      icon={CalendarDays}
      delay={delay}
      headerRight={
        <span className="font-mono text-xs text-primary/70">{events.length} events</span>
      }
    >
      <ul className="flex flex-col gap-2">
        {events.map((e) => {
          const accent = ACCENT[e.accent ?? "cyan"];
          const hi = highlighted.includes(e.id);
          return (
            <li
              key={e.id}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors",
                hi ? "bg-primary/10" : "hover:bg-white/[0.03]",
              )}
            >
              <span
                className="h-9 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-heading text-sm font-medium text-ink">
                  {e.title}
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-[11px] text-ink-dim">
                  {e.location && (
                    <span className="flex min-w-0 items-center gap-1">
                      <MapPin size={11} className="shrink-0" />
                      <span className="truncate">{e.location}</span>
                    </span>
                  )}
                  {e.attendees ? (
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {e.attendees}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-mono text-xs text-ink">{prettyTime(e.start)}</div>
                <div className="font-mono text-[10px] text-ink-dim">{prettyTime(e.end)}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </WidgetTile>
  );
}
