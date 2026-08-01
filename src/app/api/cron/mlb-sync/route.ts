import { NextRequest, NextResponse } from "next/server";
import { todaysSchedule } from "@/lib/mlb";
export async function GET(request: NextRequest) { if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse("Unauthorized", { status: 401 }); const schedule = await todaysSchedule(); return NextResponse.json({ ok: true, message: "MLB sync placeholder: schedule loaded; implement boxscore-to-HomeRunEvent import next.", dates: schedule.dates?.length ?? 0 }); }
