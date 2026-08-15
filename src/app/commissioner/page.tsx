import Link from "next/link";
import { redirect } from "next/navigation";
import { getCommissionerUser } from "@/lib/commissioner-auth";

export default async function CommissionerPage() {
  const user = await getCommissionerUser();
  if (!user) redirect("/commissioner/login?next=/commissioner");
  return <main className="shell"><Link className="updated" href="/">← Home</Link><section className="hero"><p className="eyebrow">Commissioner portal</p><h1>League admin</h1><p className="lede">Signed in as {user.email}.</p></section><section className="admin-links"><Link className="card admin-link" href="/commissioner/league"><p className="eyebrow">League setup</p><h2>Teams and captains</h2><p className="updated">Create and manage teams, captains, and fourteen-slot rosters.</p></Link><Link className="card admin-link" href="/commissioner/transactions"><p className="eyebrow">League operations</p><h2>Transactions and MLB data</h2><p className="updated">Manage roster moves, league transfers, and historical home-run imports.</p></Link></section></main>;
}
