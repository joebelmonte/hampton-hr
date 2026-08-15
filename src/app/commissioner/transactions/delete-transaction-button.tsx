"use client";

import { deleteTransaction } from "./actions";

export function DeleteTransactionButton({ transactionId }: { transactionId: string }) {
  return <form action={deleteTransaction} onSubmit={(event) => {
    if (!window.confirm("Delete this transaction and restore the prior roster assignment?")) event.preventDefault();
  }}><input type="hidden" name="transactionId" value={transactionId} /><button className="button button-danger" type="submit">Delete</button></form>;
}
