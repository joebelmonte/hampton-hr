import Link from "next/link";
import { getMlbStatsLastUpdated, getStandings } from "@/lib/standings";
import { StandingsTable } from "./standings-table";
import { StatsRefresh } from "./stats-refresh";
import { isMlbStatsStale } from "@/lib/stats-refresh";
import { getActiveSeason, getArchivedSeasons } from "@/lib/seasons";

export const dynamic = "force-dynamic";

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
  const [standings, statsLastUpdated, activeSeason, archivedSeasons] = await Promise.all([getStandings(), getMlbStatsLastUpdated(), getActiveSeason(), getArchivedSeasons()]);

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Hampton Home Run League</p>
        <h1>Every blast counts.</h1>
        <p className="lede">{activeSeason ? `Live standings from the ${activeSeason.year} fourteen-slot home run race.` : "The current season has concluded."}</p>
        {activeSeason && <p className="updated">Scoring refreshes via the MLB sync job</p>}
        {!activeSeason && <p className="updated"><Link href="/commissioner">Commissioner admin →</Link></p>}
      </section>
      {activeSeason && <section className="card" aria-label="League standings">
        <div className="card-heading"><h2>Standings</h2><Link href="/commissioner">Commissioner admin →</Link></div>
        <StatsRefresh needed={isMlbStatsStale(statsLastUpdated)} />
        <StandingsTable standings={standings} />
        <p className="footnote">Team totals include the twelve highest-scoring slots. The two lowest slots are excluded.</p>
        <p className="footnote">Stats last updated: {statsLastUpdated ? lastUpdatedLabel(statsLastUpdated) : "Not yet synced"}.</p>
      </section>}
      {archivedSeasons.length > 0 && <section className="card" style={{ marginTop: activeSeason ? 28 : 0 }}><div className="card-heading"><h2>Past seasons</h2></div><div className="transaction-panel">{archivedSeasons.map((season) => <p key={season.id}><Link className="team-link" href={`/seasons/${season.year}`}>{season.year} final standings →</Link></p>)}</div></section>}
    </main>
  );
}
