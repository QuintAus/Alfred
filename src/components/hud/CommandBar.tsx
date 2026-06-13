"use client";

import { Mic, ChevronRight } from "lucide-react";
import { CornerBrackets } from "@/components/ui/CornerBrackets";

/**
 * Command bar. Decorative in Phase 1 — becomes the text command input in
 * Phase 2 and the push-to-talk control in Phase 4.
 */
export function CommandBar() {
  return (
    <div className="glass relative flex items-center gap-3 rounded-full px-4 py-2.5">
      <CornerBrackets size={9} opacity={0.4} />
      <ChevronRight size={16} className="shrink-0 text-primary" />
      <input
        disabled
        placeholder="Voice matrix online in Phase 4 — text command in Phase 2…"
        className="min-w-0 flex-1 bg-transparent font-heading text-sm text-ink placeholder:text-ink-dim/70 focus:outline-none"
      />
      <span className="hidden font-mono text-[10px] tracking-[0.3em] text-ink-dim sm:inline">
        STANDBY
      </span>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
        <Mic size={16} />
      </span>
    </div>
  );
}
