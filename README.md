# J.A.R.V.I.S. — Personal Command Dashboard

A holographic HUD command-center inspired by Tony Stark's AI assistant. A single
web app that looks like a Stark HUD, listens for a wake word, takes voice
commands, and uses **Claude (the Anthropic API) as its brain** — Claude
interprets what you say, decides which of your connected apps to pull data from,
responds in natural language, and drives what the dashboard displays.

> **Status: Phase 4 complete** — JARVIS now has a **voice**: speak commands
> (push-to-talk or the "Hey JARVIS" wake word), hear spoken replies, and watch the
> visualizer ring react to your live microphone. Built on Phases 1–3 (the animated
> HUD, the Claude brain, and real Google data).
>
> Degrades gracefully at every layer: no Anthropic key → **demo mode**; no Google
> → **mock data**; no mic/voice support → the **text command bar** still works.

---

## Tech stack

| Concern        | Choice                                              |
| -------------- | --------------------------------------------------- |
| Framework      | Next.js 16 (App Router) + TypeScript                |
| Brain          | `@anthropic-ai/sdk` · Claude (Opus 4.8)             |
| Google         | `googleapis` (Calendar / Gmail / Drive / Tasks)     |
| Streaming      | Server-Sent Events (Route Handler + ReadableStream) |
| Styling        | Tailwind CSS v4 (`@theme` tokens)                   |
| Animation      | Motion (Framer Motion) + Canvas 2D                  |
| State          | Zustand                                             |
| Voice          | Web Speech API (STT/TTS) · Picovoice Porcupine (wake word) |
| Fonts          | Orbitron · Rajdhani · JetBrains Mono (next/font)    |

Later phases add: Spotify, monday.com, real web search / weather; ElevenLabs /
Deepgram voice upgrades.

---

## Prerequisites

- **Node.js 20+** (developed on Node 22) and npm.
- Optional but recommended: an **Anthropic API key** (the brain) and a **Google
  Cloud OAuth client** (your data). Without them the app still runs on
  demo/mock data.

## Setup

```bash
npm install
cp .env.example .env.local     # then fill in what you have
npm run dev                    # → http://localhost:3000
```

Environment variables (`.env.local`, all optional — fill in what you want live):

| Variable                | What it is                                                        |
| ----------------------- | ---------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`     | The brain. `console.anthropic.com` → API Keys. Unset → demo mode |
| `GOOGLE_CLIENT_ID`      | OAuth client id (see checklist below)                            |
| `GOOGLE_CLIENT_SECRET`  | OAuth client secret                                              |
| `GOOGLE_REDIRECT_URI`   | `http://localhost:3000/api/auth/google/callback` (default)       |
| `TOKEN_ENCRYPTION_KEY`  | Any long random string; encrypts stored tokens. `openssl rand -hex 32` |

`.env.local` is git-ignored. **Restart the dev server after editing it.**

---

## Connect your Google account (Phase 3)

A one-time setup in the [Google Cloud Console](https://console.cloud.google.com):

1. **Create a project** (top bar → project picker → *New Project*).
2. **Enable APIs:** *APIs & Services → Library* → enable **Google Calendar API**,
   **Gmail API**, **Google Drive API**, and **Google Tasks API**.
3. **OAuth consent screen:** *APIs & Services → OAuth consent screen* →
   **External** → fill app name + your email. Under **Test users**, add your own
   Google address (keeps the app in "testing" so you don't need verification).
4. **Create credentials:** *APIs & Services → Credentials → Create Credentials →
   OAuth client ID* → **Web application**. Under **Authorised redirect URIs** add:
   `http://localhost:3000/api/auth/google/callback`
5. Copy the **Client ID** and **Client secret** into `.env.local`
   (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`), set `TOKEN_ENCRYPTION_KEY` to a
   random string, and **restart** the dev server.
6. In the HUD, click **CONNECT GOOGLE** (top-right) → approve the scopes. Done.

**Scopes requested (least privilege):** Calendar `events` (read **+ create**),
Gmail `readonly`, Tasks `readonly`, Drive `metadata.readonly`, plus basic profile
to show which account is connected. Adjust in `src/config/google.ts` (then
disconnect + reconnect to re-consent).

### Quick test

- **"What's on my schedule today?"** → real events fill the agenda tile.
- **"Any unread email?"** → your inbox; **"what are my tasks?"** → your to-dos.
- **"Schedule a 30-minute sync tomorrow at 10am"** → creates a real calendar event.
- The top-right badge shows the connected account; click it to disconnect.

> No key/connection? The same commands work on mock data so you can see the loop.

---

## Voice (Phase 4)

Click the **speaker** toggle in the command bar to enable spoken replies (and the
wake word). Then:

- **Push-to-talk:** click the **mic** and speak — your words become a command and
  JARVIS replies out loud. The visualizer ring reacts to your live mic level.
- **"Hey JARVIS" wake word** (optional): say it to start listening hands-free.
  Needs a free Picovoice key (below). Without it, push-to-talk still works.
- The text command bar is always there as a fallback.

STT/TTS use the browser-native Web Speech API (best in Chrome); the app prefers an
`en-GB` system voice for the butler tone.

### "Hey JARVIS" wake word (optional)

1. Get a free **AccessKey** from the [Picovoice Console](https://console.picovoice.ai/).
2. Download the English params model **`porcupine_params.pv`** from the
   [Porcupine repo](https://github.com/Picovoice/porcupine/tree/master/lib/common)
   and drop it in **`public/`**.
3. Set `NEXT_PUBLIC_PICOVOICE_ACCESS_KEY` in `.env.local` and restart.
4. Enable voice (speaker toggle) — JARVIS wakes to "Jarvis" (a Porcupine built-in
   keyword, so no model training needed).

---

## How it works

```
your command
  → POST /api/command  (SSE)
  → Claude (system prompt = JARVIS persona) with tool definitions
  → Claude calls tools → backend runs them:
        connected to Google?  → real Calendar/Gmail/Drive/Tasks data
        not connected?        → mock data
  → results go back to Claude
  → Claude streams a spoken reply + update_display directives
  → SSE pushes status, tool activity, the reply, fresh widget data, and
    focus/highlight to the browser in real time
```

The browser only ever talks to our own API routes. The Anthropic key, the Google
client secret, and your OAuth tokens all stay server-side; tokens are encrypted
at rest under `TOKEN_ENCRYPTION_KEY`.

---

## Project structure

```
src/
├─ app/
│  ├─ globals.css                    # ★ THEME TOKENS — colours, fonts, effects
│  ├─ api/command/route.ts           # ★ orchestration loop (SSE, tool use)
│  └─ api/auth/                       # Google OAuth: google, callback, status, disconnect
├─ config/
│  ├─ persona.ts                     # ★ editable JARVIS system prompt
│  └─ google.ts                      # ★ OAuth scopes (least privilege)
├─ components/hud/
│  ├─ CentralCore · VoiceVisualizer · ArcReactor · BootSequence …
│  ├─ CommandBar · ResponsePanel     # command input + live exchange
│  ├─ VoiceProvider.tsx              # STT/TTS, live mic amplitude, wake word
│  └─ GoogleConnect.tsx              # connect/disconnect control
├─ components/widgets/               # Calendar, Inbox, Tasks, Weather, NowPlaying, Stats
└─ lib/
   ├─ store.ts · useCommand.ts       # ★ state + SSE client hook
   ├─ tools/index.ts                 # ★ tool defs + handlers (real Google / mock)
   ├─ server/
   │  ├─ anthropic.ts                # Claude client + model id
   │  ├─ google.ts                   # OAuth client + session management
   │  ├─ google-data.ts              # Google API → widget shapes
   │  └─ token-store.ts              # AES-256-GCM encrypted token storage
   ├─ types.ts · mock-data.ts · utils.ts
```

★ = the files you'll most often edit.

## Customising

- **Personality:** `src/config/persona.ts`. **Scopes:** `src/config/google.ts`.
- **Add a capability:** add one `ToolSpec` to `src/lib/tools/index.ts`.
- **Model:** `src/lib/server/anthropic.ts` (`JARVIS_MODEL`).
- **Colours & fonts:** `src/app/globals.css`. **Mock data:** `src/lib/mock-data.ts`.

---

## Roadmap

- **Phase 1 — UI shell (done):** animated HUD on mock data.
- **Phase 2 — Claude brain (done):** SSE orchestration loop, tools, persona.
- **Phase 3 — Google integration (done):** OAuth 2.0, encrypted tokens, real
  Calendar/Gmail/Drive/Tasks, calendar event creation, mock fallback.
- **Phase 4 — Voice (done):** speech-to-text + TTS (Web Speech API), "Hey JARVIS"
  wake word (Porcupine), visualizer hooked to live mic amplitude, push-to-talk.
- **Phase 5 — Polish & expand:** Spotify, monday.com, real web search/weather;
  ElevenLabs / Deepgram upgrade hooks.

## Security

- **No secrets in the frontend.** Anthropic key + Google client secret are read
  only under `src/lib/server/` and the API routes; the browser talks only to our
  own endpoints.
- **OAuth tokens encrypted at rest** (AES-256-GCM) under `.data/` (git-ignored),
  never in localStorage. CSRF-protected OAuth flow (`state` cookie).
- **Least-privilege scopes** — read-only except calendar event creation.
- `.env*` (except `.env.example`) and `.data/` are git-ignored.
- Localhost-only by default; expose remotely only behind auth + HTTPS.
