import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/tts — ElevenLabs text-to-speech proxy (Phase 5 upgrade hook).
 * Gated on ELEVENLABS_API_KEY; returns 501 if unset so the browser falls back
 * to the Web Speech voice. The key stays server-side.
 */
export async function POST(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return new NextResponse("ElevenLabs not configured", { status: 501 });

  let text = "";
  try {
    ({ text } = await req.json());
  } catch {
    /* ignore */
  }
  if (!text?.trim()) return new NextResponse("No text", { status: 400 });

  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb";
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: "eleven_turbo_v2_5" }),
  });
  if (!r.ok) return new NextResponse("TTS upstream failed", { status: 502 });

  return new NextResponse(await r.arrayBuffer(), {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  });
}
