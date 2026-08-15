import { NextRequest, NextResponse } from "next/server";
import { sendDailyStandingsEmails } from "@/lib/daily-email";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const result = await sendDailyStandingsEmails();
    return NextResponse.json({ ok: result.failures.length === 0, ...result }, { status: result.failures.length ? 500 : 200 });
  } catch (error) {
    console.error("Daily standings email failed", error);
    return NextResponse.json({ ok: false, error: "Daily standings email failed." }, { status: 500 });
  }
}
