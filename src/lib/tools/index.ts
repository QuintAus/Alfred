import type Anthropic from "@anthropic-ai/sdk";
import { mockDashboard } from "@/lib/mock-data";
import type { WidgetKey } from "@/lib/types";

/**
 * ============================================================================
 *  TOOL LAYER  —  the things JARVIS (Claude) can do.
 * ============================================================================
 * Each tool is ONE definition (the schema Claude sees) + ONE handler (what the
 * backend runs). Adding an integration = add one `ToolSpec` to `toolSpecs`.
 *
 * Phase 2: handlers return MOCK data (the shapes from lib/mock-data.ts).
 * Phase 3: swap each handler's body for a real Google/Spotify/etc. API call —
 * the return shapes stay identical, so nothing downstream changes.
 */
export interface ToolSpec {
  definition: Anthropic.Tool;
  /** Short label shown on the HUD activity chip while the tool runs. */
  label: string;
  /** Widget this tool surfaces; auto-focused on the HUD when it runs. */
  widget?: WidgetKey;
  /** The implementation. Mock for now; real API call from Phase 3. */
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

export const toolSpecs: Record<string, ToolSpec> = {
  get_calendar_events: {
    label: "Calendar",
    widget: "calendar",
    definition: {
      name: "get_calendar_events",
      description:
        "Get the user's calendar events. Call this whenever the user asks about their schedule, agenda, meetings, or what's on today.",
      input_schema: {
        type: "object",
        properties: {
          day: {
            type: "string",
            description: "Which day, e.g. 'today' or 'tomorrow'. Defaults to today.",
          },
        },
      },
    },
    handler: async () => mockDashboard.calendar,
  },

  search_emails: {
    label: "Inbox",
    widget: "inbox",
    definition: {
      name: "search_emails",
      description:
        "Search the user's email inbox. Call this when the user asks about email, mail, messages, or who has written to them.",
      input_schema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Optional keyword to filter by sender or subject.",
          },
        },
      },
    },
    handler: async (input) => {
      const query = typeof input.query === "string" ? input.query.toLowerCase() : "";
      const { unread, emails } = mockDashboard.inbox;
      if (!query) return { unread, emails };
      const filtered = emails.filter(
        (e) =>
          e.sender.toLowerCase().includes(query) ||
          e.subject.toLowerCase().includes(query) ||
          e.snippet.toLowerCase().includes(query),
      );
      return { unread, emails: filtered };
    },
  },

  get_tasks: {
    label: "Tasks",
    widget: "tasks",
    definition: {
      name: "get_tasks",
      description:
        "Get the user's to-do tasks. Call this when the user asks about their tasks, to-dos, what they need to do, or what's outstanding.",
      input_schema: { type: "object", properties: {} },
    },
    handler: async () => mockDashboard.tasks,
  },

  get_weather: {
    label: "Weather",
    widget: "weather",
    definition: {
      name: "get_weather",
      description:
        "Get the current weather and short forecast. Call this when the user asks about the weather, temperature, or forecast.",
      input_schema: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "City or place. Defaults to the user's current location.",
          },
        },
      },
    },
    handler: async (input) => {
      const location = typeof input.location === "string" ? input.location : undefined;
      return location ? { ...mockDashboard.weather, location } : mockDashboard.weather;
    },
  },

  get_now_playing: {
    label: "Now Playing",
    widget: "nowPlaying",
    definition: {
      name: "get_now_playing",
      description:
        "Get the track currently playing. Call this when the user asks what's playing, about music, or the current song.",
      input_schema: { type: "object", properties: {} },
    },
    handler: async () => mockDashboard.nowPlaying,
  },

  web_search: {
    label: "Web Search",
    definition: {
      name: "web_search",
      description:
        "Search the public web for current information. Call this only for news or facts that are NOT in the user's own calendar, mail, tasks, weather, or music.",
      input_schema: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query." },
        },
        required: ["query"],
      },
    },
    handler: async (input) => {
      const query = typeof input.query === "string" ? input.query : "";
      // Mock results — Phase 5 wires a real search provider.
      return {
        query,
        results: [
          {
            title: `Top result for "${query}"`,
            snippet:
              "Mock search result. Real web search is wired in a later phase.",
            source: "example.com",
          },
        ],
      };
    },
  },

  [UPDATE_DISPLAY]: {
    label: "Display",
    definition: {
      name: UPDATE_DISPLAY,
      description:
        "Update the dashboard to match what you're saying: focus a widget and highlight the specific items you mention by their id. Call this whenever you reference something the user can see on screen.",
      input_schema: {
        type: "object",
        properties: {
          focus: {
            type: "string",
            enum: WIDGET_KEYS,
            description: "Which widget to bring into focus.",
          },
          highlight: {
            type: "array",
            items: { type: "string" },
            description: "Ids of the items to highlight (e.g. event or email ids).",
          },
        },
      },
    },
    // Intercepted by the route handler; this is a safety no-op.
    handler: async () => ({ ok: true }),
  },
};

/** All tool definitions, in a stable order, for the Claude request. */
export const toolDefinitions: Anthropic.Tool[] = Object.values(toolSpecs).map(
  (t) => t.definition,
);
