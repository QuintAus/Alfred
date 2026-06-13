import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { isSpotifyConfigured, buildAuthUrl } from "@/lib/server/spotify";
import { hasEncryptionKey } from "@/lib/server/token-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/auth/spotify — start the Spotify OAuth flow. */
export async function GET(request: NextRequest) {
  if (!isSpotifyConfigured()) {
    return NextResponse.redirect(new URL("/?spotify=unconfigured", request.url));
  }
  if (!hasEncryptionKey()) {
    return NextResponse.redirect(new URL("/?spotify=nokey", request.url));
  }
  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(buildAuthUrl(state));
  res.cookies.set("s_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 600,
  });
  return res;
}
