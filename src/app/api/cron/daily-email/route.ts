import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) { if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse("Unauthorized", { status: 401 }); return NextResponse.json({ ok: true, message: "Daily email placeholder: build standings, render Resend template, send to each owner." }); }
