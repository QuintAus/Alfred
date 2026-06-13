"use client";

import { useState } from "react";
import { Mic, ChevronRight, Send } from "lucide-react";
import { useJarvis } from "@/lib/store";
import { useCommand } from "@/lib/useCommand";
import { cn } from "@/lib/utils";
import { CornerBrackets } from "@/components/ui/CornerBrackets";

/**
 * Command bar — type a command and JARVIS runs the orchestration loop.
 * The mic button is a Phase 4 placeholder (voice input).
 */
export function CommandBar() {
  const [value, setValue] = useState("");
  const isProcessing = useJarvis((s) => s.isProcessing);
  const mode = useJarvis((s) => s.mode);
  const send = useCommand();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || isProcessing) return;
    setValue("");
    void send(text);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="glass relative flex items-center gap-3 rounded-full px-4 py-2.5"
    >
      <CornerBrackets size={9} opacity={0.4} />
      <ChevronRight size={16} className="shrink-0 text-primary" />

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={isProcessing}
        placeholder={
          isProcessing
            ? "JARVIS is working…"
            : "Ask JARVIS… e.g. “what's on my schedule today?”"
        }
        className="min-w-0 flex-1 bg-transparent font-heading text-sm text-ink placeholder:text-ink-dim/70 focus:outline-none disabled:opacity-60"
        aria-label="Command input"
      />

      {mode && (
        <span
          className={cn(
            "hidden rounded-full px-2 py-0.5 font-mono text-[9px] tracking-[0.25em] sm:inline",
            mode === "demo"
              ? "bg-accent/15 text-accent"
              : "bg-success/15 text-success",
          )}
          title={mode === "demo" ? "Demo mode — no API key set" : "Live — connected to Claude"}
        >
          {mode === "demo" ? "DEMO" : "LIVE"}
        </span>
      )}

      {/* send / working indicator */}
      {isProcessing ? (
        <span className="grid h-9 w-9 shrink-0 place-items-center" aria-label="Working">
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary"
                style={{ animation: `reactor-pulse 1s ease-in-out ${i * 0.15}s infinite` }}
              />
            ))}
          </span>
        </span>
      ) : (
        <button
          type="submit"
          disabled={!value.trim()}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30 transition-colors hover:bg-primary/25 disabled:opacity-40"
          aria-label="Send command"
        >
          <Send size={15} />
        </button>
      )}

      {/* voice — Phase 4 */}
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-dim/60 ring-1 ring-primary/10"
        title="Voice input arrives in Phase 4"
      >
        <Mic size={16} />
      </span>
    </form>
  );
}
