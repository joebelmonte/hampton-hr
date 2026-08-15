import { NextRequest, NextResponse } from "next/server";
import { processNextMlbBackfillDay, syncRecentHomeRuns } from "@/lib/mlb-sync";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const recent = await syncRecentHomeRuns();
    const backfill = await processNextMlbBackfillDay();
    return NextResponse.json({ ok: true, recent, backfill });
  } catch (error) {
    console.error("MLB sync failed", error);
    return NextResponse.json({ ok: false, error: "MLB sync failed." }, { status: 500 });
  }
}
