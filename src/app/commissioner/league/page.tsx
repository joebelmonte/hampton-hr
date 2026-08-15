import Link from "next/link";
import { requireCommissioner } from "@/lib/commissioner-auth";
import { getLeagueAdminTeams } from "@/lib/league-admin";
import { TeamManager } from "./team-manager";

export default async function LeagueSetupPage() {
  await requireCommissioner("/commissioner/league");
  const teams = await getLeagueAdminTeams();
  return <main className="shell"><Link className="updated" href="/commissioner/transactions">← Commissioner portal</Link><section className="hero"><p className="eyebrow">Commissioner portal</p><h1>League setup</h1><p className="lede">Manage teams, captains, and the league’s fourteen-slot rosters.</p></section><section className="card"><div className="transaction-panel"><TeamManager teams={teams} /></div></section></main>;
}
