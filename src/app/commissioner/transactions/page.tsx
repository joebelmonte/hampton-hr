import Link from "next/link";
import { getLeagueTeams } from "@/lib/standings";
import { getTransactions } from "@/lib/standings";
import { getMlbBackfills } from "@/lib/mlb-sync";
import { BackfillForm } from "./backfill-form";
import { TransactionTransfer } from "./transaction-transfer";
import { requireCommissioner } from "@/lib/commissioner-auth";
import { TestEmailForm } from "./test-email-form";
import { TransactionForm } from "./transaction-form";
import { TransactionList } from "./transaction-list";

export default async function TransactionsPage() {
  await requireCommissioner();
  const [teams, transactions, backfills] = await Promise.all([getLeagueTeams(), getTransactions(), getMlbBackfills()]);
  const today = new Date().toISOString().slice(0, 10);
  return <main className="shell"><Link className="updated" href="/">← Home</Link><section className="card form-card" style={{marginTop: 18}}><p className="eyebrow">Commissioner portal</p><h1 style={{fontSize:"2.6rem"}}>Replace a player</h1><p><Link className="updated" href="/commissioner/league">Manage teams and captains →</Link></p>{teams.length ? <TransactionForm teams={teams} today={today} /> : <p className="updated">Import a league setup or set up the league before recording a transaction.</p>}<p className="updated">The outgoing player is determined from the selected slot’s dated roster history. Saving creates an audit record and assignment timeline entries.</p></section><section className="card" style={{marginTop: 28}}><div className="card-heading"><h2>Daily email</h2></div><div className="transaction-panel"><p className="updated">Send one preview to your signed-in commissioner email. Test sends do not affect the daily delivery record.</p>{teams.length ? <TestEmailForm teams={teams} /> : null}</div></section><section className="card" style={{marginTop: 28}}><div className="card-heading"><h2>Transfer league setup</h2></div><div className="transaction-panel"><TransactionTransfer /></div></section><section className="card" style={{marginTop: 28}}><div className="card-heading"><h2>Historical MLB import</h2></div><div className="transaction-panel"><p className="updated">Each scheduled sync imports one game day, so a full-season backfill runs safely in the background.</p><BackfillForm today={today} />{backfills.length ? <div className="backfill-history">{backfills.map((backfill) => <p key={backfill.id}><strong>{backfill.status}</strong> · {backfill.startDate.toLocaleDateString()}–{backfill.endDate.toLocaleDateString()} · next: {backfill.nextDate.toLocaleDateString()}</p>)}</div> : null}</div></section><section className="card" style={{marginTop: 28}}><div className="card-heading"><h2>All transactions</h2><Link href="/transactions">Public history →</Link></div><div className="transaction-panel"><TransactionList transactions={transactions} canDelete /></div></section></main>;
}
