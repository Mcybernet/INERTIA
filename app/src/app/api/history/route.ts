import { NextResponse } from "next/server";
import { loadHistory } from "@/lib/server/history";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";
  const limit = Number(url.searchParams.get("limit") ?? "200");
  try {
    const events = await loadHistory(Number.isFinite(limit) ? limit : 200, force);
    return NextResponse.json(events, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}
