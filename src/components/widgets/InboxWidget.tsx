"use client";

import { Mail, Star } from "lucide-react";
import { useJarvis } from "@/lib/store";
import { cn } from "@/lib/utils";
import { WidgetTile } from "./WidgetTile";

export function InboxWidget({ delay }: { delay?: number }) {
  const inbox = useJarvis((s) => s.data.inbox);
  const highlighted = useJarvis((s) => s.highlightedIds);

  return (
    <WidgetTile
      title="Inbox"
      widgetKey="inbox"
      icon={Mail}
      accent="var(--color-accent)"
      delay={delay}
      headerRight={
        <span className="rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[11px] text-accent">
          {inbox.unread} unread
        </span>
      }
    >
      <ul className="flex flex-col gap-1.5">
        {inbox.emails.map((m) => {
          const hi = highlighted.includes(m.id);
          return (
            <li
              key={m.id}
              className={cn(
                "relative rounded-lg px-2.5 py-2 transition-colors",
                hi ? "bg-primary/10" : "hover:bg-white/[0.03]",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    m.unread ? "bg-primary shadow-[0_0_8px_var(--color-primary)]" : "bg-ink-dim/40",
                  )}
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate font-heading text-sm",
                    m.unread ? "font-semibold text-ink" : "text-ink-dim",
                  )}
                >
                  {m.sender}
                </span>
                {m.important && <Star size={12} className="shrink-0 text-accent" fill="currentColor" />}
                <span className="shrink-0 font-mono text-[10px] text-ink-dim">{m.time}</span>
              </div>
              <div className="mt-0.5 truncate pl-3.5 text-xs text-ink">{m.subject}</div>
              <div className="truncate pl-3.5 text-[11px] text-ink-dim">{m.snippet}</div>
            </li>
          );
        })}
      </ul>
    </WidgetTile>
  );
}
