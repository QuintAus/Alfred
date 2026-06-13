/**
 * Shared domain types for the JARVIS dashboard.
 *
 * These describe the *data* the HUD renders. In Phase 1 they are populated from
 * mock-data.ts; from Phase 3 the same shapes are returned by the real tool
 * handlers (Google Calendar / Gmail / Drive / Tasks, Spotify, etc.). Keeping
 * the shapes stable means the UI never has to change when the data source does.
 */

/** The JARVIS runtime state — drives the arc reactor + voice visualizer. */
export type JarvisStatus =
  | "booting" // boot sequence playing
  | "idle" // standing by, calm pulse
  | "listening" // mic open, visualizer reacts to input amplitude
  | "thinking" // Claude is processing / tools running, fast flicker
  | "speaking" // TTS playing, visualizer pulses to output
  | "error"; // something went wrong, amber alert

export interface CalendarEvent {
  id: string;
  title: string;
  /** 24h "HH:MM" */
  start: string;
  /** 24h "HH:MM" */
  end: string;
  location?: string;
  /** Visual accent for the event chip. */
  accent?: "cyan" | "amber" | "violet" | "green";
  attendees?: number;
}

export interface EmailSummary {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  /** Friendly relative time, e.g. "08:42" or "2h". */
  time: string;
  unread: boolean;
  important?: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  done: boolean;
  priority: "low" | "medium" | "high";
  due?: string;
}

export interface WeatherData {
  location: string;
  tempC: number;
  condition: string;
  /** Short code used to pick an icon/glyph. */
  icon: "clear" | "cloud" | "rain" | "storm" | "snow" | "fog";
  highC: number;
  lowC: number;
  hourly: { time: string; tempC: number }[];
}

export interface NowPlaying {
  isPlaying: boolean;
  track: string;
  artist: string;
  album: string;
  /** 0..1 progress through the track. */
  progress: number;
  durationSec: number;
}

export interface QuickStat {
  id: string;
  label: string;
  value: string;
  hint?: string;
  accent?: "cyan" | "amber" | "green";
}

/** The complete data payload the dashboard renders. */
export interface DashboardData {
  calendar: CalendarEvent[];
  inbox: { unread: number; emails: EmailSummary[] };
  tasks: TaskItem[];
  weather: WeatherData;
  nowPlaying: NowPlaying;
  stats: QuickStat[];
}

/**
 * UI directives — the structured half of Claude's response (Phase 2+).
 * Claude returns natural-language `speech` plus this object telling the HUD
 * which widget to focus, what to highlight, and any transient cards to show.
 * Defined now so the rendering layer is built against the final contract.
 */
export type WidgetKey =
  | "calendar"
  | "inbox"
  | "tasks"
  | "weather"
  | "nowPlaying"
  | "stats";

export interface UiDirective {
  /** Widget to bring into focus / enlarge. */
  focus?: WidgetKey;
  /** IDs (events, emails, tasks) to highlight within their widget. */
  highlight?: string[];
  /** Optional transient cards Claude wants surfaced. */
  cards?: { type: WidgetKey; data: unknown }[];
}

/** The full assistant response contract from the backend (Phase 2+). */
export interface AssistantResponse {
  speech: string;
  ui?: UiDirective;
}

/**
 * Streaming protocol (Phase 2). The /api/command route streams these as
 * Server-Sent Events; the client (`useCommand`) parses them and drives the
 * store. Keeping the union here means the server and client agree on the wire.
 */
export type ServerEvent =
  | { type: "mode"; mode: "live" | "demo" }
  | { type: "status"; status: JarvisStatus }
  | { type: "tool"; id?: string; name: string; label: string; phase: "start" | "end" }
  | { type: "text"; delta: string }
  | { type: "ui"; focus?: WidgetKey | null; highlight?: string[] }
  | { type: "data"; widget: WidgetKey; payload: unknown }
  | { type: "error"; message: string }
  | { type: "done" };

/** One turn of the conversation, kept in the store for context + display. */
export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

/** A tool invocation surfaced in the HUD while Claude works. */
export interface ToolActivity {
  id: string;
  label: string;
  status: "running" | "done";
}
