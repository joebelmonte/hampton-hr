import Link from "next/link";
import { getMlbStatsLastUpdated, getStandings } from "@/lib/standings";
import { StandingsTable } from "./standings-table";

function lastUpdatedLabel(updatedAt: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(updatedAt);
}

export default async function LeaguePage() {
  const [standings, statsLastUpdated] = await Promise.all([getStandings(), getMlbStatsLastUpdated()]);

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Hampton Home Run League</p>
        <h1>Every blast counts.</h1>
        <p className="lede">Live standings from the league’s fourteen-slot home run race.</p>
        <p className="updated">Scoring refreshes via the MLB sync job</p>
      </section>
      <section className="card" aria-label="League standings">
        <div className="card-heading"><h2>Standings</h2><Link href="/commissioner">Commissioner admin →</Link></div>
        <StandingsTable standings={standings} />
        <p className="footnote">Team totals include the twelve highest-scoring slots. The two lowest slots are excluded.</p>
        <p className="footnote">Stats last updated: {statsLastUpdated ? lastUpdatedLabel(statsLastUpdated) : "Not yet synced"}.</p>
      </section>
    </main>
  );
}
