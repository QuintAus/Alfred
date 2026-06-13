"use client";

import { ListChecks, Check } from "lucide-react";
import { useJarvis } from "@/lib/store";
import { cn } from "@/lib/utils";
import { WidgetTile } from "./WidgetTile";

const PRIORITY: Record<string, string> = {
  high: "var(--color-danger)",
  medium: "var(--color-accent)",
  low: "var(--color-primary)",
};

export function TasksWidget({ delay }: { delay?: number }) {
  const tasks = useJarvis((s) => s.data.tasks);
  const highlighted = useJarvis((s) => s.highlightedIds);
  const open = tasks.filter((t) => !t.done).length;

  return (
    <WidgetTile
      title="Tasks"
      widgetKey="tasks"
      icon={ListChecks}
      accent="var(--color-success)"
      delay={delay}
      headerRight={<span className="font-mono text-xs text-primary/70">{open} open</span>}
    >
      <ul className="flex flex-col gap-1">
        {tasks.map((t) => {
          const hi = highlighted.includes(t.id);
          return (
            <li
              key={t.id}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors",
                hi ? "bg-primary/10" : "hover:bg-white/[0.03]",
              )}
            >
              <span
                className={cn(
                  "grid h-4 w-4 shrink-0 place-items-center rounded border",
                  t.done
                    ? "border-success bg-success/20 text-success"
                    : "border-ink-dim/50 text-transparent",
                )}
              >
                <Check size={11} strokeWidth={3} />
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate font-heading text-sm",
                  t.done ? "text-ink-dim line-through" : "text-ink",
                )}
              >
                {t.title}
              </span>
              {t.due && !t.done && (
                <span className="shrink-0 font-mono text-[10px] text-ink-dim">{t.due}</span>
              )}
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: PRIORITY[t.priority], boxShadow: `0 0 6px ${PRIORITY[t.priority]}` }}
                title={`${t.priority} priority`}
              />
            </li>
          );
        })}
      </ul>
    </WidgetTile>
  );
}
