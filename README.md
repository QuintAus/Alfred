# J.A.R.V.I.S. — Personal Command Dashboard

A holographic HUD command-center inspired by Tony Stark's AI assistant. A single
web app that looks like a Stark HUD, listens for a wake word, takes voice
commands, and uses **Claude (the Anthropic API) as its brain** — Claude
interprets what you say, decides which of your connected apps to pull data from,
responds in natural language, and drives what the dashboard displays.

> **Status: Phase 1 complete** — the full animated HUD shell, running on mock
> data. Boot sequence, arc reactor, reactive voice visualizer, and all widget
> tiles are live. No backend, APIs, or microphone yet (those are Phases 2–4).

---

## Tech stack

| Concern        | Choice                                            |
| -------------- | ------------------------------------------------- |
| Framework      | Next.js 16 (App Router) + TypeScript              |
| Styling        | Tailwind CSS v4 (`@theme` tokens)                 |
| Animation      | Motion (Framer Motion) + Canvas 2D                |
| Icons          | lucide-react                                      |
| State          | Zustand                                           |
| Fonts          | Orbitron · Rajdhani · JetBrains Mono (next/font)  |

Later phases add: `@anthropic-ai/sdk` (the brain), `googleapis` (Calendar / Gmail
/ Drive / Tasks), Web Speech API + Picovoice Porcupine (voice + wake word).

---

## Prerequisites

- **Node.js 20+** (developed on Node 22) and npm.
- No environment variables are required for Phase 1. (Anthropic / Google keys
  arrive in Phases 2–3 — see the Roadmap.)

## Run it (Phase 1)

```bash
npm install      # if you haven't already
npm run dev      # starts the dev server
```

Then open **http://localhost:3000**.

> Production preview: `npm run build && npm start`.

### Quick test

1. On load you'll see the **boot sequence** — the arc reactor powers up, system
   checks stream in, and it fades into the live HUD (~4s). Click anywhere to skip.
2. **Click the central arc reactor** to cycle JARVIS through its states
   (`listening → thinking → speaking → idle`) and watch the **circular voice
   visualizer** react differently to each — this is the reactive ring that real
   mic/TTS audio will drive in Phase 4.

---

## Project structure

```
src/
├─ app/
│  ├─ layout.tsx          # fonts (Orbitron/Rajdhani/JetBrains) + metadata
│  ├─ page.tsx            # renders <Dashboard/>
│  └─ globals.css         # ★ THEME TOKENS — colours, fonts, HUD effects, keyframes
├─ components/
│  ├─ hud/
│  │  ├─ Dashboard.tsx        # top-level layout + boot hand-off
│  │  ├─ BootSequence.tsx     # cinematic boot overlay
│  │  ├─ CentralCore.tsx      # reactor + visualizer + clock/date/status
│  │  ├─ ArcReactor.tsx       # the arc reactor (SVG + CSS)
│  │  ├─ VoiceVisualizer.tsx  # ★ reactive circular audio ring (Canvas)
│  │  ├─ ParticleField.tsx    # constellation background (Canvas)
│  │  ├─ HudFrame.tsx         # grid / vignette / radial glow overlays
│  │  ├─ StatusBar.tsx        # top wordmark + telemetry
│  │  └─ CommandBar.tsx       # command input (wired in Phase 2/4)
│  ├─ widgets/                # Calendar, Inbox, Tasks, Weather, NowPlaying, Stats
│  └─ ui/CornerBrackets.tsx   # HUD corner decoration
└─ lib/
   ├─ store.ts            # ★ Zustand store — status, audio level, focus, data
   ├─ types.ts            # domain types + the Claude UI-directive contract
   ├─ mock-data.ts        # ★ all mock widget data (swapped for real APIs later)
   └─ utils.ts            # cn(), time/date formatting
```

★ = the files you'll most often edit.

## Customising

- **Colours & fonts:** `src/app/globals.css` — every colour and font is a token
  at the top of the file (`--color-primary`, `--color-accent`, `--font-display`…).
- **Mock data:** `src/lib/mock-data.ts` — change the agenda, inbox, tasks, etc.
- **The JARVIS personality prompt** lands in Phase 2 as its own clearly-labelled
  file so you can tune his voice.

---

## Roadmap

- **Phase 1 — UI shell (done):** animated HUD on mock data.
- **Phase 2 — Claude brain:** backend, Anthropic SDK, tool schemas (mock impls),
  text command box, streamed responses driving the UI. Adds the editable JARVIS
  persona prompt + `ANTHROPIC_API_KEY`.
- **Phase 3 — Google integration:** OAuth 2.0, real Calendar/Gmail/Drive/Tasks
  tools (read-only by default). Adds Google Cloud setup + env vars.
- **Phase 4 — Voice:** speech-to-text, TTS, "Hey JARVIS" wake word (Porcupine),
  visualizer hooked to live mic/TTS amplitude, push-to-talk fallback.
- **Phase 5 — Polish & expand:** Spotify, monday.com, web search; ElevenLabs /
  Deepgram upgrade hooks.

## Security (enforced from the start)

- No secrets in the frontend — all API keys stay server-side (Phase 2+).
- `.env*` and credentials are git-ignored.
- Localhost-only by default; remote access requires auth + HTTPS first.
- Least-privilege OAuth scopes (Phase 3).
