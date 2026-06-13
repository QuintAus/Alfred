import { NextResponse } from "next/server";
import { getConnection } from "@/lib/server/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/auth/status — is Google connected, and as whom? */
export async function GET() {
  return NextResponse.json(await getConnection());
}
