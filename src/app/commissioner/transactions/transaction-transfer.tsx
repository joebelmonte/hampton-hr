"use client";

import { useActionState } from "react";
import { importTransactions, type TransactionFormState } from "./actions";

const initialState: TransactionFormState = {};

export function TransactionTransfer() {
  const [state, action, pending] = useActionState(importTransactions, initialState);
  return <div><p><a className="button" href="/api/commissioner/transactions/export">Export league setup</a></p><form action={action} onSubmit={(event) => {
    if (!window.confirm("Import this complete league setup into an empty league? This cannot be undone from the app.")) event.preventDefault();
  }} className="transfer-form"><label>Import league export<input name="transactionBundle" type="file" accept="application/json,.json" required /></label><button className="button button-danger" type="submit" disabled={pending}>{pending ? "Importing…" : "Import into empty league"}</button>{state.error && <p role="alert" style={{ color: "var(--red)" }}>{state.error}</p>}{state.success && <p role="status" style={{ color: "var(--green)" }}>{state.success}</p>}</form><p className="updated">The export includes team names, captain emails, slots, transactions, and dated roster assignments. Import only runs when the destination has no teams; player and MLB home-run data are preserved.</p></div>;
}
