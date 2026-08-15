import { DeleteTransactionButton } from "./delete-transaction-button";

type Transaction = {
  id: string;
  effectiveDate: Date;
  notes: string | null;
  team: { name: string };
  slot: { number: number };
  playerIn: { fullName: string };
  playerOut: { fullName: string } | null;
};

export function TransactionList({ transactions, canDelete = false }: { transactions: Transaction[]; canDelete?: boolean }) {
  if (!transactions.length) return <p className="updated">No transactions recorded yet.</p>;
  return <div className="transaction-list">{transactions.map((transaction) => <article className="transaction" key={transaction.id}>
    <div><strong>{transaction.effectiveDate.toLocaleDateString()}</strong><p>{transaction.team.name} · Slot #{transaction.slot.number}</p><p className="updated">OUT {transaction.playerOut?.fullName ?? "Vacant slot"} · IN {transaction.playerIn.fullName}{transaction.notes ? ` · ${transaction.notes}` : ""}</p></div>
    {canDelete && <DeleteTransactionButton transactionId={transaction.id} />}
  </article>)}</div>;
}
