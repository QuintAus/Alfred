import { NextResponse, type NextRequest } from "next/server";
import { handleCallback } from "@/lib/server/spotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/auth/spotify/callback — Spotify redirects here with the auth code. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const denied = params.get("error");

  if (denied) return NextResponse.redirect(new URL("/?spotify=denied", request.url));

  const expected = request.cookies.get("s_oauth_state")?.value;
  if (!code || !state || !expected || state !== expected) {
    return NextResponse.redirect(new URL("/?spotify=badstate", request.url));
  }

  try {
    await handleCallback(code);
  } catch {
    return NextResponse.redirect(new URL("/?spotify=error", request.url));
  }

  const res = NextResponse.redirect(new URL("/?spotify=connected", request.url));
  res.cookies.delete("s_oauth_state");
  return res;
}
