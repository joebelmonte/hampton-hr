import { NextResponse } from "next/server";
import { syncRecentHomeRunsIfStale } from "@/lib/mlb-sync";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(await syncRecentHomeRunsIfStale());
}
