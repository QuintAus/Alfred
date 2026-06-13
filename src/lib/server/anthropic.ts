import Anthropic from "@anthropic-ai/sdk";

/**
 * Server-only Anthropic client.
 *
 * SECURITY: this module reads ANTHROPIC_API_KEY from the server environment and
 * must never be imported into a "use client" component. It is imported only by
 * the /api/command route handler (and the tool layer), which run on the server.
 */

/**
 * The Claude model JARVIS thinks with. Editable.
 * Verified against the Claude API reference — Opus 4.8 is the current most
 * capable model. Swap to "claude-sonnet-4-6" for faster/cheaper responses.
 */
export const JARVIS_MODEL = "claude-opus-4-8";

/**
 * Output ceiling per turn. Generous headroom so adaptive-thinking tokens never
 * truncate the spoken reply; the persona keeps actual replies short. We stream,
 * so a high ceiling carries no timeout risk.
 */
export const JARVIS_MAX_TOKENS = 16000;

/** True when an API key is configured (otherwise the route runs in demo mode). */
export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Returns an Anthropic client, or null when no API key is set. */
export function getAnthropic(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}
