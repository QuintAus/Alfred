# J.A.R.V.I.S. — Personal Command Dashboard

A holographic HUD command-center inspired by Tony Stark's AI assistant. A single
web app that looks like a Stark HUD, listens for a wake word, takes voice
commands, and uses **Claude (the Anthropic API) as its brain** — Claude
interprets what you say, decides which of your connected apps to pull data from,
responds in natural language, and drives what the dashboard displays.

> **Status: Phase 2 complete** — the Claude orchestration loop is live. Type a
> command and JARVIS picks tools, streams a spoken-style reply, and drives the
> HUD (focusing widgets, highlighting items) in real time. Tools return mock
> data for now; real Google/Spotify integrations arrive in Phase 3+.
>
> Runs **with or without** an Anthropic key: set `ANTHROPIC_API_KEY` for the real
> brain, or leave it unset to see the same loop in **demo mode**.

---

## Tech stack

| Concern        | Choice                                            |
| -------------- | ------------------------------------------------- |
| Framework      | Next.js 16 (App Router) + TypeScript              |
| Brain          | `@anthropic-ai/sdk` · Claude (Opus 4.8)           |
| Streaming      | Server-Sent Events (Route Handler + ReadableStream) |
| Styling        | Tailwind CSS v4 (`@theme` tokens)                 |
| Animation      | Motion (Framer Motion) + Canvas 2D                |
| Icons          | lucide-react                                      |
| State          | Zustand                                           |
| Fonts          | Orbitron · Rajdhani · JetBrains Mono (next/font)  |

Later phases add: `googleapis` (Calendar / Gmail / Drive / Tasks), Web Speech API
+ Picovoice Porcupine (voice + wake word).

---

## Prerequisites

- **Node.js 20+** (developed on Node 22) and npm.
- Optional: an **Anthropic API key** for the real brain (Phase 2). Without it,
  the dashboard runs in demo mode.

## Setup

```bash
npm install
cp .env.example .env.local   # then paste your key (optional)
```

Open `.env.local` and set:

```
ANTHROPIC_API_KEY=sk-ant-...   # from https://console.anthropic.com → API Keys
```

`.env.local` is git-ignored, so your key is never committed. Leave it blank to
run in demo mode.

## Run it

```bash
npm run dev      # → http://localhost:3000
```

> Production preview: `npm run build && npm start`.

### Quick test (Phase 2)

1. Let the **boot sequence** finish (or click to skip).
2. In the command bar at the bottom of the core, type:
   **"What's on my schedule today?"** and press Enter.
3. Watch the loop run: the reactor goes to **thinking**, a **Calendar** tool chip
   appears, the calendar widget **focuses and highlights** the 9 AM event, then
   JARVIS's reply **streams in** word-by-word as the visualizer pulses to
   **speaking**. Try "any new email?", "what's the weather?", "what's playing?".
4. The badge by the input reads **LIVE** (real Claude) or **DEMO** (no key).

> Earlier Phase 1 toy: clicking the central arc reactor still cycles its states
> so you can watch the visualizer react to each.

---

## How the brain works (Phase 2)

```
your command
  → POST /api/command
  → Claude (system prompt = the JARVIS persona) with tool definitions
  → Claude calls tools (get_calendar_events, search_emails, …)
  → backend runs the tool handlers (mock data now; real APIs in Phase 3)
  → results go back to Claude
  → Claude streams a spoken reply + calls update_display to drive the HUD
  → all of it streams to the browser as Server-Sent Events
```

The whole exchange streams over SSE, so the UI starts reacting the moment Claude
does. The frontend only ever talks to our own `/api/command` route — the API key
stays server-side.

---

## Project structure

```
src/
├─ app/
│  ├─ layout.tsx              # fonts + metadata
│  ├─ page.tsx                # renders <Dashboard/>
│  ├─ globals.css             # ★ THEME TOKENS — colours, fonts, HUD effects
│  └─ api/command/route.ts    # ★ the orchestration loop (SSE, tool use)
├─ config/
│  └─ persona.ts              # ★ the editable JARVIS personality / system prompt
├─ components/
│  ├─ hud/
│  │  ├─ Dashboard.tsx        # top-level layout + boot hand-off
│  │  ├─ CentralCore.tsx      # reactor + visualizer + clock/date/status
│  │  ├─ VoiceVisualizer.tsx  # ★ reactive circular audio ring (Canvas)
│  │  ├─ CommandBar.tsx       # the text command input
│  │  ├─ ResponsePanel.tsx    # shows the live exchange + tool activity
│  │  ├─ ArcReactor / BootSequence / ParticleField / HudFrame / StatusBar
│  ├─ widgets/                # Calendar, Inbox, Tasks, Weather, NowPlaying, Stats
│  └─ ui/CornerBrackets.tsx   # HUD corner decoration
└─ lib/
   ├─ store.ts                # ★ Zustand store — status, conversation, focus, data
   ├─ useCommand.ts           # client hook: POST + consume the SSE stream
   ├─ tools/index.ts          # ★ tool definitions + handlers (one block per tool)
   ├─ server/anthropic.ts     # server-only Claude client + model id
   ├─ types.ts                # domain types, UI-directive + SSE event contracts
   ├─ mock-data.ts            # ★ all mock data (swapped for real APIs later)
   └─ utils.ts                # cn(), time/date formatting
```

★ = the files you'll most often edit.

## Customising

- **JARVIS's personality:** `src/config/persona.ts` — one editable system prompt.
- **Add a capability:** `src/lib/tools/index.ts` — add one `ToolSpec` (definition
  + handler) and JARVIS can use it. Handlers return mock data today; swap the body
  for a real API call in Phase 3.
- **The model:** `src/lib/server/anthropic.ts` — `JARVIS_MODEL` (defaults to
  `claude-opus-4-8`; switch to `claude-sonnet-4-6` for faster/cheaper replies).
- **Colours & fonts:** `src/app/globals.css` — all tokens at the top.
- **Mock data:** `src/lib/mock-data.ts`.

---

## Roadmap

- **Phase 1 — UI shell (done):** animated HUD on mock data.
- **Phase 2 — Claude brain (done):** backend orchestration loop, Anthropic SDK,
  tool schemas (mock impls), text command box, SSE-streamed responses that drive
  the UI, editable JARVIS persona, demo-mode fallback.
- **Phase 3 — Google integration:** OAuth 2.0, real Calendar/Gmail/Drive/Tasks
  tools (read-only by default). Adds Google Cloud setup + env vars.
- **Phase 4 — Voice:** speech-to-text, TTS, "Hey JARVIS" wake word (Porcupine),
  visualizer hooked to live mic/TTS amplitude, push-to-talk fallback.
- **Phase 5 — Polish & expand:** Spotify, monday.com, real web search; ElevenLabs
  / Deepgram upgrade hooks.

## Security (enforced from the start)

- No secrets in the frontend — the Anthropic key is read only in
  `src/lib/server/` and the API route; the browser talks only to `/api/command`.
- `.env*` (except `.env.example`) and credentials are git-ignored.
- Localhost-only by default; remote access requires auth + HTTPS first.
- Least-privilege OAuth scopes (Phase 3).
