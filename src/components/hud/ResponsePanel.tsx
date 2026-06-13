"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import { useJarvis } from "@/lib/store";
import { CornerBrackets } from "@/components/ui/CornerBrackets";

/**
 * Shows the current exchange beneath the core: the user's command, any tool
 * activity, and JARVIS's spoken reply as it streams in. Hidden until the first
 * command. Status/visualizer reactivity is handled by the core; this is the text.
 */
export function ResponsePanel() {
  const transcript = useJarvis((s) => s.transcript);
  const streamingText = useJarvis((s) => s.streamingText);
  const activities = useJarvis((s) => s.activities);
  const isProcessing = useJarvis((s) => s.isProcessing);

  const lastUserIndex = (() => {
    for (let i = transcript.length - 1; i >= 0; i--) {
      if (transcript[i].role === "user") return i;
    }
    return -1;
  })();

  const userText = lastUserIndex >= 0 ? transcript[lastUserIndex].text : "";
  const next = transcript[lastUserIndex + 1];
  const assistantText =
    streamingText || (next && next.role === "assistant" ? next.text : "");

  const visible = transcript.length > 0 || isProcessing;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.35 }}
          className="glass relative rounded-2xl p-3.5"
        >
          <CornerBrackets size={10} opacity={0.4} />

          {/* user command */}
          {userText && (
            <div className="mb-2 flex items-start gap-2">
              <span className="mt-0.5 shrink-0 font-mono text-[9px] tracking-[0.3em] text-ink-dim">
                YOU
              </span>
              <span className="text-sm text-ink-dim">{userText}</span>
            </div>
          )}

          {/* tool activity */}
          {activities.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {activities.map((a) => (
                <span
                  key={a.id}
                  className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 font-mono text-[10px] text-primary"
                >
                  {a.status === "running" ? (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  ) : (
                    <Check size={11} className="text-success" strokeWidth={3} />
                  )}
                  {a.label}
                </span>
              ))}
            </div>
          )}

          {/* JARVIS reply */}
          <div className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 font-mono text-[9px] tracking-[0.3em] text-primary">
              JARVIS
            </span>
            <p className="max-h-40 overflow-y-auto text-sm leading-relaxed text-ink text-glow">
              {assistantText}
              {isProcessing && (
                <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-primary align-middle" />
              )}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
