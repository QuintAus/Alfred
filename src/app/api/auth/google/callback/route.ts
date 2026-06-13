import { NextResponse, type NextRequest } from "next/server";
import { handleCallback } from "@/lib/server/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/auth/google/callback — Google redirects here with the auth code. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const denied = params.get("error");

  if (denied) {
    return NextResponse.redirect(new URL("/?google=denied", request.url));
  }

  const expected = request.cookies.get("g_oauth_state")?.value;
  if (!code || !state || !expected || state !== expected) {
    return NextResponse.redirect(new URL("/?google=badstate", request.url));
  }

  try {
    await handleCallback(code);
  } catch {
    return NextResponse.redirect(new URL("/?google=error", request.url));
  }

  const res = NextResponse.redirect(new URL("/?google=connected", request.url));
  res.cookies.delete("g_oauth_state");
  return res;
}
