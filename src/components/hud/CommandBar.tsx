"use client";

import { useState } from "react";
import { Mic, ChevronRight, Send, Volume2, VolumeX } from "lucide-react";
import { useJarvis } from "@/lib/store";
import { useCommand } from "@/lib/useCommand";
import { useVoice } from "./VoiceProvider";
import { cn } from "@/lib/utils";
import { CornerBrackets } from "@/components/ui/CornerBrackets";

/**
 * Command bar — type a command, or use the mic (push-to-talk) and the voice
 * toggle (spoken replies + "Hey JARVIS" wake word). Voice is Phase 4.
 */
export function CommandBar() {
  const [value, setValue] = useState("");
  const isProcessing = useJarvis((s) => s.isProcessing);
  const mode = useJarvis((s) => s.mode);
  const send = useCommand();
  const voice = useVoice();

  const listening = voice?.listening ?? false;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || isProcessing) return;
    setValue("");
    void send(text);
  };

  const toggleMic = () => {
    if (!voice?.sttSupported) return;
    if (listening) voice.stopListening();
    else voice.startListening();
  };

  const voiceTitle = !voice
    ? ""
    : voice.enabled
      ? voice.wakeReady
        ? "Voice on — listening for “Hey JARVIS”"
        : "Voice replies on (set a Picovoice key for the wake word)"
      : "Enable spoken replies + wake word";

  return (
    <form
      onSubmit={onSubmit}
      className="glass relative flex items-center gap-2 rounded-full px-4 py-2.5"
    >
      <CornerBrackets size={9} opacity={0.4} />
      <ChevronRight size={16} className="shrink-0 text-primary" />

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={isProcessing}
        placeholder={
          listening
            ? "Listening…"
            : isProcessing
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
            mode === "demo" ? "bg-accent/15 text-accent" : "bg-success/15 text-success",
          )}
          title={mode === "demo" ? "Demo mode — no API key set" : "Live — connected to Claude"}
        >
          {mode === "demo" ? "DEMO" : "LIVE"}
        </span>
      )}

      {/* voice replies + wake-word toggle */}
      {voice && (
        <button
          type="button"
          onClick={voice.toggleEnabled}
          title={voiceTitle}
          aria-pressed={voice.enabled}
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-full ring-1 transition-colors",
            voice.enabled
              ? "bg-primary/15 text-primary ring-primary/30"
              : "text-ink-dim/60 ring-primary/10 hover:text-ink",
          )}
        >
          {voice.enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      )}

      {/* push-to-talk mic */}
      <button
        type="button"
        onClick={toggleMic}
        disabled={!voice?.sttSupported}
        title={
          voice?.sttSupported
            ? listening
              ? "Stop listening"
              : "Speak a command"
            : "Speech recognition isn't supported in this browser"
        }
        aria-pressed={listening}
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-full ring-1 transition-colors disabled:opacity-40",
          listening
            ? "bg-primary text-base shadow-[0_0_16px_var(--color-primary)] ring-primary"
            : "bg-primary/15 text-primary ring-primary/30 hover:bg-primary/25",
        )}
      >
        <Mic size={16} className={listening ? "animate-pulse" : ""} />
      </button>

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
    </form>
  );
}
