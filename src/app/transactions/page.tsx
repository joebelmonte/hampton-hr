import Link from "next/link";
import { getTransactions } from "@/lib/standings";
import { TransactionList } from "@/app/commissioner/transactions/transaction-list";

export default async function TransactionsPage() {
  const transactions = await getTransactions();
  return <main className="shell"><Link className="updated" href="/">← All standings</Link><section className="hero"><p className="eyebrow">League activity</p><h1>Transactions</h1><p className="lede">Every roster move across the league.</p></section><section className="card"><div className="transaction-panel"><TransactionList transactions={transactions} /></div></section></main>;
}
