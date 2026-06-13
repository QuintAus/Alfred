import { NextResponse } from "next/server";
import { disconnectGoogle } from "@/lib/server/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/auth/google/disconnect — revoke + forget the stored tokens. */
export async function POST() {
  await disconnectGoogle();
  return NextResponse.json({ ok: true });
}
