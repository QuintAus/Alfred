import type Anthropic from "@anthropic-ai/sdk";
import { mockDashboard } from "@/lib/mock-data";
import type { WidgetKey } from "@/lib/types";
import { getAuthedClient } from "@/lib/server/google";
import * as g from "@/lib/server/google-data";

/**
 * ============================================================================
 *  TOOL LAYER  —  the things JARVIS (Claude) can do.
 * ============================================================================
 * Each tool is ONE definition (the schema Claude sees) + ONE handler.
 * Adding an integration = add one `ToolSpec`.
 *
 * Phase 3: read handlers use REAL Google data when the account is connected
 * (getAuthedClient), and fall back to mock data otherwise so the app always
 * works. Weather / now-playing stay mock until Phase 5.
 */
export interface ToolSpec {
  definition: Anthropic.Tool;
  /** Short label shown on the HUD activity chip. */
  label: string;
  /** Widget to focus on the HUD when the tool runs. */
  widget?: WidgetKey;
  /** True if the handler returns this widget's data shape (pushed to the HUD). */
  widgetData?: boolean;
  handler: (input: Record<string, unknown>) => Promise<unknown>;
}

/** Name of the special UI tool the route intercepts to drive focus/highlight. */
export const UPDATE_DISPLAY = "update_display";

const WIDGET_KEYS: WidgetKey[] = [
  "calendar",
  "inbox",
  "tasks",
  "weather",
  "nowPlaying",
  "stats",
];

const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

export const toolSpecs: Record<string, ToolSpec> = {
  get_calendar_events: {
    label: "Calendar",
    widget: "calendar",
    widgetData: true,
    definition: {
      name: "get_calendar_events",
      description:
        "Get the user's calendar events for today. Call this whenever the user asks about their schedule, agenda, meetings, or what's on.",
      input_schema: {
        type: "object",
        properties: {
          day: { type: "string", description: "Which day. Defaults to today." },
        },
      },
    },
    handler: async () => {
      const client = await getAuthedClient();
      return client ? g.getCalendarEvents(client) : mockDashboard.calendar;
    },
  },

  create_calendar_event: {
    label: "Calendar",
    widget: "calendar",
    definition: {
      name: "create_calendar_event",
      description:
        "Create a new calendar event. Call this when the user asks to schedule, book, or add something to their calendar. Confirm the details in your reply.",
      input_schema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Event title." },
          start: { type: "string", description: "Start time, ISO 8601 (e.g. 2026-06-14T09:00:00)." },
          end: { type: "string", description: "End time, ISO 8601." },
          location: { type: "string", description: "Optional location." },
        },
        required: ["title", "start", "end"],
      },
    },
    handler: async (input) => {
      const client = await getAuthedClient();
      if (!client) {
        return { created: false, note: "Not connected to Google — ask the user to connect their account first." };
      }
      const title = str(input.title);
      const start = str(input.start);
      const end = str(input.end);
      if (!title || !start || !end) {
        return { created: false, note: "title, start and end are required." };
      }
      return g.createCalendarEvent(client, { title, start, end, location: str(input.location) });
    },
  },

  search_emails: {
    label: "Inbox",
    widget: "inbox",
    widgetData: true,
    definition: {
      name: "search_emails",
      description:
        "Search the user's email inbox. Call this when the user asks about email, mail, messages, or who has written to them.",
      input_schema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Optional Gmail search query (e.g. a sender or keyword)." },
        },
      },
    },
    handler: async (input) => {
      const client = await getAuthedClient();
      if (client) return g.searchEmails(client, str(input.query));
      // mock fallback (with optional keyword filter)
      const query = str(input.query)?.toLowerCase();
      const { unread, emails } = mockDashboard.inbox;
      if (!query) return { unread, emails };
      return {
        unread,
        emails: emails.filter(
          (e) =>
            e.sender.toLowerCase().includes(query) ||
            e.subject.toLowerCase().includes(query) ||
            e.snippet.toLowerCase().includes(query),
        ),
      };
    },
  },

  get_tasks: {
    label: "Tasks",
    widget: "tasks",
    widgetData: true,
    definition: {
      name: "get_tasks",
      description:
        "Get the user's to-do tasks. Call this when the user asks about their tasks, to-dos, or what they need to do.",
      input_schema: { type: "object", properties: {} },
    },
    handler: async () => {
      const client = await getAuthedClient();
      return client ? g.getTasks(client) : mockDashboard.tasks;
    },
  },

  get_drive_files: {
    label: "Drive",
    definition: {
      name: "get_drive_files",
      description:
        "List the user's recent Google Drive files (names only, read-only). Call this when the user asks about their files or documents.",
      input_schema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Optional filename keyword." },
        },
      },
    },
    handler: async (input) => {
      const client = await getAuthedClient();
      if (!client) return { files: [], note: "Not connected to Google Drive." };
      return { files: await g.getDriveFiles(client, str(input.query)) };
    },
  },

  get_weather: {
    label: "Weather",
    widget: "weather",
    widgetData: true,
    definition: {
      name: "get_weather",
      description:
        "Get the current weather and short forecast. Call this when the user asks about the weather, temperature, or forecast.",
      input_schema: {
        type: "object",
        properties: { location: { type: "string", description: "City or place." } },
      },
    },
    // Weather is mock until Phase 5 (a weather provider).
    handler: async (input) => {
      const location = str(input.location);
      return location ? { ...mockDashboard.weather, location } : mockDashboard.weather;
    },
  },

  get_now_playing: {
    label: "Now Playing",
    widget: "nowPlaying",
    widgetData: true,
    definition: {
      name: "get_now_playing",
      description:
        "Get the track currently playing. Call this when the user asks what's playing or about music.",
      input_schema: { type: "object", properties: {} },
    },
    // Now-playing is mock until Phase 5 (Spotify).
    handler: async () => mockDashboard.nowPlaying,
  },

  web_search: {
    label: "Web Search",
    definition: {
      name: "web_search",
      description:
        "Search the public web for current information. Call this only for news or facts NOT in the user's own calendar, mail, tasks, drive, weather, or music.",
      input_schema: {
        type: "object",
        properties: { query: { type: "string", description: "The search query." } },
        required: ["query"],
      },
    },
    handler: async (input) => ({
      query: str(input.query) ?? "",
      results: [
        {
          title: `Top result for "${str(input.query) ?? ""}"`,
          snippet: "Mock search result. A real web-search provider is wired in Phase 5.",
          source: "example.com",
        },
      ],
    }),
  },

  [UPDATE_DISPLAY]: {
    label: "Display",
    definition: {
      name: UPDATE_DISPLAY,
      description:
        "Update the dashboard to match what you're saying: focus a widget and highlight the specific items you mention by their id. Call this whenever you reference something the user can see.",
      input_schema: {
        type: "object",
        properties: {
          focus: { type: "string", enum: WIDGET_KEYS, description: "Widget to focus." },
          highlight: {
            type: "array",
            items: { type: "string" },
            description: "Ids of items to highlight.",
          },
        },
      },
    },
    handler: async () => ({ ok: true }), // intercepted by the route
  },
};

export const toolDefinitions: Anthropic.Tool[] = Object.values(toolSpecs).map(
  (t) => t.definition,
);
