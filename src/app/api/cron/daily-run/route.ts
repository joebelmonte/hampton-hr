import { NextRequest, NextResponse } from "next/server";
import { sendDailyStandingsEmails } from "@/lib/daily-email";
import { processNextMlbBackfillDay, syncRecentHomeRuns } from "@/lib/mlb-sync";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const recent = await syncRecentHomeRuns();
    const backfill = await processNextMlbBackfillDay();
    const email = await sendDailyStandingsEmails();
    return NextResponse.json({ ok: email.failures.length === 0, recent, backfill, email }, { status: email.failures.length ? 500 : 200 });
  } catch (error) {
    console.error("Daily MLB sync and email failed", error);
    return NextResponse.json({ ok: false, error: "Daily MLB sync and email failed." }, { status: 500 });
  }
}
