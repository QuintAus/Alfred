import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { isGoogleConfigured, buildAuthUrl } from "@/lib/server/google";
import { hasEncryptionKey } from "@/lib/server/token-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/auth/google — start the OAuth consent flow. */
export async function GET(request: NextRequest) {
  if (!isGoogleConfigured()) {
    return NextResponse.redirect(new URL("/?google=unconfigured", request.url));
  }
  if (!hasEncryptionKey()) {
    return NextResponse.redirect(new URL("/?google=nokey", request.url));
  }

  // CSRF guard: random state echoed back on the callback.
  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(buildAuthUrl(state));
  res.cookies.set("g_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // localhost http; set true behind HTTPS
    path: "/",
    maxAge: 600,
  });
  return res;
}
