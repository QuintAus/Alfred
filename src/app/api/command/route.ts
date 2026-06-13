import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic, JARVIS_MODEL, JARVIS_MAX_TOKENS } from "@/lib/server/anthropic";
import { JARVIS_SYSTEM_PROMPT } from "@/config/persona";
import { toolDefinitions, toolSpecs, UPDATE_DISPLAY } from "@/lib/tools";
import type { ChatTurn, ServerEvent, WidgetKey } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  // Disable proxy buffering so events arrive in real time (see Next streaming docs).
  "X-Accel-Buffering": "no",
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * POST /api/command — the orchestration loop.
 *
 *   transcript  →  Claude (with tools)  →  tool calls  →  tool results  →  Claude
 *                                  ↳ streams speech text + UI directives back as SSE
 *
 * Body: { message: string, history?: ChatTurn[] }
 * Streams `ServerEvent`s as Server-Sent Events.
 */
export async function POST(req: Request) {
  let body: { message?: string; history?: ChatTurn[] };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  const message = (body.message ?? "").trim();
  const history = Array.isArray(body.history) ? body.history : [];
  if (!message) return new Response("Empty message", { status: 400 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: ServerEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          closed = true;
        }
      };
      const finish = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      try {
        const client = getAnthropic();
        if (!client) {
          send({ type: "mode", mode: "demo" });
          await runDemo(message, send);
        } else {
          send({ type: "mode", mode: "live" });
          await runClaude(client, message, history, send, req.signal);
        }
        send({ type: "done" });
      } catch (err) {
        if (!req.signal.aborted) {
          send({ type: "error", message: toErrorMessage(err) });
        }
      } finally {
        finish();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

/** Real orchestration loop against Claude with streaming + tool use. */
async function runClaude(
  client: Anthropic,
  message: string,
  history: ChatTurn[],
  send: (e: ServerEvent) => void,
  signal: AbortSignal,
) {
  const messages: Anthropic.MessageParam[] = [
    ...history.map((t) => ({ role: t.role, content: t.text }) as Anthropic.MessageParam),
    { role: "user", content: message },
  ];

  send({ type: "status", status: "thinking" });

  // Bounded agentic loop: model → tools → model → … until it stops asking for tools.
  for (let turn = 0; turn < 6; turn++) {
    if (signal.aborted) return;

    const stream = client.messages.stream(
      {
        model: JARVIS_MODEL,
        max_tokens: JARVIS_MAX_TOKENS,
        system: JARVIS_SYSTEM_PROMPT,
        thinking: { type: "adaptive" },
        tools: toolDefinitions,
        messages,
      },
      { signal },
    );

    let speaking = false;
    stream.on("text", (delta) => {
      if (!speaking) {
        speaking = true;
        send({ type: "status", status: "speaking" });
      }
      send({ type: "text", delta });
    });

    const msg = await stream.finalMessage();
    messages.push({ role: "assistant", content: msg.content });

    if (msg.stop_reason !== "tool_use") break;

    // Execute every tool the model asked for, collect results, loop again.
    send({ type: "status", status: "thinking" });
    const toolUses = msg.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );
    const results: Anthropic.ToolResultBlockParam[] = [];

    for (const tu of toolUses) {
      const input = (tu.input ?? {}) as Record<string, unknown>;

      // update_display is intercepted to drive the HUD; it returns no data.
      if (tu.name === UPDATE_DISPLAY) {
        send({
          type: "ui",
          focus: (input.focus as WidgetKey) ?? undefined,
          highlight: Array.isArray(input.highlight) ? (input.highlight as string[]) : undefined,
        });
        results.push({ type: "tool_result", tool_use_id: tu.id, content: "Display updated." });
        continue;
      }

      const spec = toolSpecs[tu.name];
      if (!spec) {
        results.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: `Unknown tool: ${tu.name}`,
          is_error: true,
        });
        continue;
      }

      send({ type: "tool", id: tu.id, name: tu.name, label: spec.label, phase: "start" });
      if (spec.widget) send({ type: "ui", focus: spec.widget });

      try {
        const data = await spec.handler(input);
        results.push({ type: "tool_result", tool_use_id: tu.id, content: JSON.stringify(data) });
      } catch (err) {
        results.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: `Tool failed: ${toErrorMessage(err)}`,
          is_error: true,
        });
      } finally {
        send({ type: "tool", id: tu.id, name: tu.name, label: spec.label, phase: "end" });
      }
    }

    messages.push({ role: "user", content: results });
  }

  send({ type: "status", status: "idle" });
}

/**
 * Demo fallback used when no ANTHROPIC_API_KEY is set. Keyword-routes the
 * command to a mock tool + canned reply, exercising the exact same SSE
 * sequence so the UI loop works end-to-end before a key is added.
 */
async function runDemo(message: string, send: (e: ServerEvent) => void) {
  const m = message.toLowerCase();
  const routes: {
    re: RegExp;
    tool: string;
    widget: WidgetKey;
    label: string;
    reply: string;
    highlight?: string[];
  }[] = [
    {
      re: /(meet|calendar|schedul|agenda|today|appointment|standup)/,
      tool: "get_calendar_events",
      widget: "calendar",
      label: "Calendar",
      reply:
        "You have four engagements today, sir. The first is the Design Team Standup at nine.",
      highlight: ["evt_1"],
    },
    {
      re: /(mail|email|inbox|message|wrote|pepper)/,
      tool: "search_emails",
      widget: "inbox",
      label: "Inbox",
      reply:
        "Twelve unread, sir. The one worth your attention is from Pepper Potts, regarding the Q3 board deck.",
      highlight: ["mail_1"],
    },
    {
      re: /(task|to-?dos?|to do|outstanding|remind|chore|errand|need to)/,
      tool: "get_tasks",
      widget: "tasks",
      label: "Tasks",
      reply: "Three tasks due today. Top of the list: approve the arc reactor schematics.",
      highlight: ["task_1"],
    },
    {
      re: /(weather|temperature|forecast|rain|sun|cold|hot)/,
      tool: "get_weather",
      widget: "weather",
      label: "Weather",
      reply: "Clear skies in Malibu, twenty-two degrees, sir, with a high of twenty-five.",
    },
    {
      re: /(play|music|song|track|listening|spotify)/,
      tool: "get_now_playing",
      widget: "nowPlaying",
      label: "Now Playing",
      reply: "Currently playing Back In Black by AC/DC. An excellent choice, sir.",
    },
  ];

  send({ type: "status", status: "thinking" });
  await delay(450);

  const route = routes.find((r) => r.re.test(m));
  const reply =
    route?.reply ??
    "I'm online and standing by, sir. Provide an Anthropic key and I'll have full use of my faculties — for now I run on demonstration data.";

  if (route) {
    send({ type: "tool", name: route.tool, label: route.label, phase: "start" });
    send({ type: "ui", focus: route.widget });
    await delay(550);
    send({ type: "tool", name: route.tool, label: route.label, phase: "end" });
    send({ type: "ui", focus: route.widget, highlight: route.highlight });
  }

  send({ type: "status", status: "speaking" });
  for (const word of reply.split(/(\s+)/)) {
    send({ type: "text", delta: word });
    if (word.trim()) await delay(45);
  }
  send({ type: "status", status: "idle" });
}

function toErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Something went wrong.";
}
