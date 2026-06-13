"use client";

import { useCallback } from "react";
import { useJarvis } from "./store";
import type { ServerEvent } from "./types";

/**
 * useCommand — sends a text command to /api/command and streams the SSE
 * response into the store, driving JARVIS's status, spoken reply, tool
 * activity, and UI directives in real time.
 *
 * Returns a `send(text)` function. The Phase 4 voice layer will call the same
 * `send` with a transcribed utterance.
 */
export function useCommand() {
  return useCallback(async (text: string) => {
    const message = text.trim();
    if (!message) return;

    const s = useJarvis.getState();
    if (s.isProcessing) return; // one command at a time

    // History = prior turns (before this one), capped for context.
    const history = s.transcript.slice(-8).map((t) => ({ role: t.role, text: t.text }));

    s.beginCommand(message);

    let failed = false;
    const fail = (msg: string) => {
      if (failed) return;
      failed = true;
      useJarvis.getState().failCommand(msg);
    };

    const handle = (event: ServerEvent) => {
      const store = useJarvis.getState();
      switch (event.type) {
        case "mode":
          store.setMode(event.mode);
          break;
        case "status":
          store.setStatus(event.status);
          break;
        case "text":
          store.appendText(event.delta);
          break;
        case "tool": {
          const id = event.id ?? event.name;
          if (event.phase === "start") {
            store.addActivity({ id, label: event.label, status: "running" });
          } else {
            store.endActivity(id);
          }
          break;
        }
        case "ui":
          store.applyDirective({ focus: event.focus ?? undefined, highlight: event.highlight });
          break;
        case "data":
          store.setWidgetData(event.widget, event.payload);
          break;
        case "error":
          fail(event.message);
          break;
        case "done":
          break;
      }
    };

    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      if (!res.ok || !res.body) {
        throw new Error(`Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line.
        let sep: number;
        while ((sep = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          const line = frame.startsWith("data:") ? frame.slice(5).trim() : frame.trim();
          if (!line) continue;
          try {
            handle(JSON.parse(line) as ServerEvent);
          } catch {
            /* ignore malformed frame */
          }
        }
      }

      if (!failed) useJarvis.getState().finishCommand();
    } catch (err) {
      fail(err instanceof Error ? err.message : "Connection lost.");
    }
  }, []);
}
