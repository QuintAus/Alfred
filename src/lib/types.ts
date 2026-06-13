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
