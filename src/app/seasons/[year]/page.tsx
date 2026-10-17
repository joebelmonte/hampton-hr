import Link from "next/link";
import { notFound } from "next/navigation";
import { StandingsTable } from "@/app/standings-table";
import { getSeasonByYear } from "@/lib/seasons";
import { getStandingsForSeason } from "@/lib/standings";

export const dynamic = "force-dynamic";

export default async function ArchivedSeasonPage({ params }: { params: Promise<{ year: string }> }) {
  const year = Number((await params).year);
  const season = await getSeasonByYear(year);
  if (!season || season.status !== "COMPLETED") notFound();
  const standings = await getStandingsForSeason(season);
  return <main className="shell"><Link className="updated" href="/">← Home</Link><section className="hero"><p className="eyebrow">Archived season</p><h1>{season.year} final standings</h1><p className="lede">Final results through {season.endDate?.toLocaleDateString("en-US", { timeZone: "UTC" })}.</p></section><section className="card"><StandingsTable standings={standings} teamHrefPrefix={`/seasons/${season.year}/teams`} /><p className="footnote">Team totals include the twelve highest-scoring slots.</p></section></main>;
}
