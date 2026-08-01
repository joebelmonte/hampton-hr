import Link from "next/link";
import { DEMO_STANDINGS } from "@/lib/demo-data";

export default function LeaguePage() {
  const maxima = ["oneDay", "sevenDays", "thirtyDays"] as const;
  const minima = ["oneDay", "sevenDays", "thirtyDays"] as const;
  const high = Object.fromEntries(maxima.map((key) => [key, Math.max(...DEMO_STANDINGS.map((team) => team[key]))]));
  const low = Object.fromEntries(minima.map((key) => [key, Math.min(...DEMO_STANDINGS.map((team) => team[key]))]));

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Hampton Home Run League</p>
        <h1>Every blast counts.</h1>
        <p className="lede">Live standings from the league’s twelve-slot home run race.</p>
        <p className="updated">Demo data · Scoring refreshes via the MLB sync job</p>
      </section>
      <section className="card" aria-label="League standings">
        <div className="card-heading"><h2>Standings</h2><Link href="/commissioner/login">Commissioner sign in →</Link></div>
        <div className="table-wrap"><table><thead><tr><th>Rank</th><th>Team</th><th>Total</th><th>1 day</th><th>7 days</th><th>30 days</th></tr></thead>
          <tbody>{DEMO_STANDINGS.map((team, index) => <tr key={team.slug}>
            <td><span className={team.movement > 0 ? "up" : team.movement < 0 ? "down" : "muted"}>{team.movement > 0 ? `↑ ${team.movement}` : team.movement < 0 ? `↓ ${Math.abs(team.movement)}` : "—"}</span></td>
            <td><Link className="team-link" href={`/teams/${team.slug}`}>{index + 1}. {team.name}</Link></td><td className="total">{team.total}</td>
            {maxima.map((key) => <td key={key} className={team[key] === high[key] ? "best" : team[key] === low[key] ? "worst" : ""}>{team[key]}</td>)}
          </tr>)}</tbody>
        </table></div>
        <p className="footnote">Team totals include the ten highest-scoring slots. The two lowest slots are excluded.</p>
      </section>
    </main>
  );
}
