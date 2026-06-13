import { create } from "zustand";
import type { DashboardData, JarvisStatus, UiDirective, WidgetKey } from "./types";
import { mockDashboard } from "./mock-data";

/**
 * Central JARVIS state.
 *
 * Drives the arc reactor + voice visualizer (`status`, `inputLevel`) and the
 * widget grid (`data`, `focusedWidget`, `highlightedIds`). Phase 2 feeds
 * `applyDirective` with Claude's UI directives; Phase 4 feeds `inputLevel`
 * with real microphone / TTS amplitude. Everything is wired against these
 * fields now so later phases only have to *call* them.
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

  // --- actions ---
  setStatus: (status: JarvisStatus) => void;
  setInputLevel: (level: number) => void;
  setBooted: (booted: boolean) => void;
  setFocus: (widget: WidgetKey | null) => void;
  /** Apply a UI directive from Claude (focus + highlight). */
  applyDirective: (ui: UiDirective) => void;
  /** Clear transient focus/highlight back to the resting HUD. */
  clearFocus: () => void;
}

export const useJarvis = create<JarvisState>((set) => ({
  status: "booting",
  inputLevel: 0,
  booted: false,

  focusedWidget: null,
  highlightedIds: [],

  data: mockDashboard,

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
}));
