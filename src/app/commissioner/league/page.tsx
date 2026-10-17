import Link from "next/link";
import { requireCommissioner } from "@/lib/commissioner-auth";
import { getLeagueAdminTeams } from "@/lib/league-admin";
import { TeamManager } from "./team-manager";
import { SeasonManager } from "./season-manager";
import { getActiveSeason } from "@/lib/seasons";

export default async function LeagueSetupPage() {
  await requireCommissioner("/commissioner/league");
  const [teams, activeSeason] = await Promise.all([getLeagueAdminTeams(), getActiveSeason()]);
  return <main className="shell"><Link className="updated" href="/commissioner/transactions">← Commissioner portal</Link><section className="hero"><p className="eyebrow">Commissioner portal</p><h1>League setup</h1><p className="lede">Manage seasons, teams, captains, and fourteen-slot rosters.</p></section><section className="card"><div className="transaction-panel"><SeasonManager activeSeason={activeSeason} /></div></section>{activeSeason && <section className="card" style={{ marginTop: 28 }}><div className="transaction-panel"><TeamManager teams={teams} /></div></section>}</main>;
}
