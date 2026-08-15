"use client";

import { useActionState } from "react";
import { createBackfill, type TransactionFormState } from "./actions";

const initialState: TransactionFormState = {};

export function BackfillForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState(createBackfill, initialState);
  return <form action={action} className="backfill-form"><label>Start date<input name="startDate" type="date" required /></label><label>End date<input name="endDate" type="date" max={today} defaultValue={today} required /></label><button className="button" type="submit" disabled={pending}>{pending ? "Queueing…" : "Queue backfill"}</button>{state.error && <p role="alert" style={{ color: "var(--red)" }}>{state.error}</p>}{state.success && <p role="status" style={{ color: "var(--green)" }}>{state.success}</p>}</form>;
}
