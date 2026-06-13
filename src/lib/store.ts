import { create } from "zustand";
import type {
  ChatTurn,
  DashboardData,
  JarvisStatus,
  ToolActivity,
  UiDirective,
  WidgetKey,
} from "./types";
import { mockDashboard } from "./mock-data";

/**
 * Central JARVIS state.
 *
 * Drives the arc reactor + voice visualizer (`status`, `inputLevel`) and the
 * widget grid (`data`, `focusedWidget`, `highlightedIds`). Phase 2 adds the
 * conversation: `useCommand` streams the backend's events into these fields
 * (`transcript`, `streamingText`, `activities`, and `applyDirective`). Phase 4
 * feeds `inputLevel` with real microphone / TTS amplitude.
 */
interface JarvisState {
  /** Current runtime state of the assistant. */
  status: JarvisStatus;
  /** Live audio amplitude 0..1 (real mic/TTS from Phase 4; 0 before that). */
  inputLevel: number;
  /** Whether the boot sequence has finished. */
  booted: boolean;

  /** Widget the HUD is currently focusing, if any. */
  focusedWidget: WidgetKey | null;
  /** Item IDs to highlight within their widgets. */
  highlightedIds: string[];

  /** The data payload rendered by the widgets. */
  data: DashboardData;

  // --- conversation (Phase 2) ---
  /** Whether a command is currently being processed. */
  isProcessing: boolean;
  /** Whether the active session is the live model or the no-key demo. */
  mode: "live" | "demo" | null;
  /** Recent conversation turns (context + display). */
  transcript: ChatTurn[];
  /** The assistant reply currently streaming in. */
  streamingText: string;
  /** Tool calls in flight / just completed, for the activity readout. */
  activities: ToolActivity[];

  // --- actions ---
  setStatus: (status: JarvisStatus) => void;
  setInputLevel: (level: number) => void;
  setBooted: (booted: boolean) => void;
  setFocus: (widget: WidgetKey | null) => void;
  /** Apply a UI directive from Claude (focus + highlight). */
  applyDirective: (ui: UiDirective) => void;
  /** Clear transient focus/highlight back to the resting HUD. */
  clearFocus: () => void;

  // --- conversation actions (Phase 2) ---
  setMode: (mode: "live" | "demo" | null) => void;
  /** Start a new command: record it and reset streaming state. */
  beginCommand: (text: string) => void;
  /** Append a streamed speech delta. */
  appendText: (delta: string) => void;
  /** Add a running tool activity. */
  addActivity: (activity: ToolActivity) => void;
  /** Mark a tool activity finished. */
  endActivity: (id: string) => void;
  /** Finish the command: commit the streamed reply to the transcript. */
  finishCommand: () => void;
  /** Abort the command, surfacing an error message in the transcript. */
  failCommand: (message: string) => void;
}

export const useJarvis = create<JarvisState>((set) => ({
  status: "booting",
  inputLevel: 0,
  booted: false,

  focusedWidget: null,
  highlightedIds: [],

  data: mockDashboard,

  isProcessing: false,
  mode: null,
  transcript: [],
  streamingText: "",
  activities: [],

  setStatus: (status) => set({ status }),
  setInputLevel: (inputLevel) => set({ inputLevel }),
  setBooted: (booted) => set({ booted, status: booted ? "idle" : "booting" }),
  setFocus: (focusedWidget) => set({ focusedWidget }),
  applyDirective: (ui) =>
    set({
      focusedWidget: ui.focus ?? null,
      highlightedIds: ui.highlight ?? [],
    }),
  clearFocus: () => set({ focusedWidget: null, highlightedIds: [] }),

  setMode: (mode) => set({ mode }),
  beginCommand: (text) =>
    set((s) => ({
      transcript: [...s.transcript, { role: "user", text }],
      streamingText: "",
      activities: [],
      isProcessing: true,
      status: "thinking",
      focusedWidget: null,
      highlightedIds: [],
    })),
  appendText: (delta) => set((s) => ({ streamingText: s.streamingText + delta })),
  addActivity: (activity) => set((s) => ({ activities: [...s.activities, activity] })),
  endActivity: (id) =>
    set((s) => ({
      activities: s.activities.map((a) =>
        a.id === id ? { ...a, status: "done" as const } : a,
      ),
    })),
  finishCommand: () =>
    set((s) => ({
      transcript: s.streamingText.trim()
        ? [...s.transcript, { role: "assistant", text: s.streamingText.trim() }]
        : s.transcript,
      streamingText: "",
      isProcessing: false,
      status: "idle",
    })),
  failCommand: (message) =>
    set((s) => ({
      transcript: [...s.transcript, { role: "assistant", text: message }],
      streamingText: "",
      isProcessing: false,
      status: "error",
    })),
}));
