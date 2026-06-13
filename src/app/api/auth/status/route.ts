import { NextResponse } from "next/server";
import { getConnection } from "@/lib/server/google";
import { getSpotifyConnection } from "@/lib/server/spotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/auth/status — connection status for each provider. */
export async function GET() {
  const [google, spotify] = await Promise.all([getConnection(), getSpotifyConnection()]);
  return NextResponse.json({ google, spotify });
}
