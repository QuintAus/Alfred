<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# JARVIS dashboard — project notes

A JARVIS-style HUD that uses Claude (Anthropic API) as the brain. Built in
phases (see README "Roadmap"). **Phase 1 (animated HUD on mock data) is done.**

Key conventions:

- **Stack:** Next.js 16 App Router + TS, Tailwind v4 (CSS `@theme` in
  `src/app/globals.css`), Motion (`motion/react`), Zustand, lucide-react.
- **State** lives in `src/lib/store.ts` (`useJarvis`). `status` + `inputLevel`
  drive the reactor/visualizer; `focusedWidget` + `highlightedIds` are the
  targets of Claude's UI directives (`UiDirective` in `src/lib/types.ts`).
- **Data shapes** are in `src/lib/types.ts`; mock data in `src/lib/mock-data.ts`.
  Real tool handlers (Phase 3+) must return these same shapes so widgets are
  source-agnostic.
- **Theme tokens** (colours/fonts) are all at the top of `globals.css`.
- **Security:** secrets are server-only; never import API keys into client
  components. `.env*` is git-ignored.
- Anything using the browser (canvas, `window`, mic) must be a `"use client"`
  component and touch browser APIs only inside effects (SSR-safe).
- Verify with `npm run build` (type-checks + builds). Browser screenshots aren't
  possible in the web sandbox (the Playwright browser CDN is network-blocked).
