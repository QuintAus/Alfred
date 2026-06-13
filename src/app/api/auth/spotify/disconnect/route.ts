import { NextResponse } from "next/server";
import { disconnectSpotify } from "@/lib/server/spotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/auth/spotify/disconnect — forget the stored Spotify tokens. */
export async function POST() {
  await disconnectSpotify();
  return NextResponse.json({ ok: true });
}
