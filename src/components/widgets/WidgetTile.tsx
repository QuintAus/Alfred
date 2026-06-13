"use client";

import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { useJarvis } from "@/lib/store";
import type { WidgetKey } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CornerBrackets } from "@/components/ui/CornerBrackets";

/**
 * Shared glassmorphism tile for every widget. Reads `focusedWidget` from the
 * store so a Claude UI directive (Phase 2+) visibly lifts the targeted tile.
 */
export function WidgetTile({
  title,
  widgetKey,
  icon: Icon,
  accent = "var(--color-primary)",
  headerRight,
  children,
  className,
  delay = 0,
}: {
  title: string;
  widgetKey: WidgetKey;
  icon: LucideIcon;
  accent?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const focused = useJarvis((s) => s.focusedWidget === widgetKey);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, scale: focused ? 1.015 : 1 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={cn(
        "glass relative flex min-h-0 flex-col rounded-xl p-3.5",
        focused && "glass-focus",
        className,
      )}
    >
      <CornerBrackets size={11} color={accent} opacity={focused ? 0.9 : 0.45} />

      {/* header */}
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={15} style={{ color: accent }} className="shrink-0" />
          <h2 className="font-heading text-xs font-semibold uppercase tracking-[0.3em] text-ink-dim">
            {title}
          </h2>
        </div>
        {headerRight}
      </div>

      {/* divider */}
      <div
        className="mb-2.5 h-px w-full"
        style={{
          background:
            "linear-gradient(to right, transparent, color-mix(in srgb, var(--color-primary) 30%, transparent), transparent)",
        }}
      />

      {/* body */}
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </motion.section>
  );
}
