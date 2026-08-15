"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveTransaction, type TransactionFormState } from "./actions";

type Team = { id: string; name: string; slots: { id: string; number: number }[] };
const initialState: TransactionFormState = {};

export function TransactionForm({ teams, today }: { teams: Team[]; today: string }) {
  const [state, action, pending] = useActionState(saveTransaction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);
  return <form ref={formRef} action={action}>
    <label>Team and slot<select name="slotId" required defaultValue=""><option value="" disabled>Select a roster slot</option>{teams.map((team) => <optgroup key={team.id} label={team.name}>{team.slots.map((slot) => <option key={slot.id} value={slot.id}>Slot #{slot.number}</option>)}</optgroup>)}</select></label>
    <label>Incoming player MLB ID<input name="mlbPlayerId" type="number" min="1" inputMode="numeric" required placeholder="e.g. 592450" /></label>
    <label>Effective date<input name="effectiveDate" type="date" defaultValue={today} required /></label>
    <label>Notes<input name="notes" placeholder="Optional commissioner note" /></label>
    <button className="button" type="submit" disabled={pending}>{pending ? "Saving…" : "Save transaction"}</button>
    {state.error && <p role="alert" style={{ color: "var(--red)" }}>{state.error}</p>}
    {state.success && <p role="status" style={{ color: "var(--green)" }}>{state.success}</p>}
  </form>;
}
