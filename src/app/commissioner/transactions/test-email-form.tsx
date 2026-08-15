"use client";

import { useActionState } from "react";
import { sendTestEmail, type TransactionFormState } from "./actions";

const initialState: TransactionFormState = {};
type Team = { id: string; name: string };

export function TestEmailForm({ teams }: { teams: Team[] }) {
  const [state, action, pending] = useActionState(sendTestEmail, initialState);
  return <form action={action} className="backfill-form"><label>Highlight team<select name="teamId" defaultValue="" required><option value="" disabled>Select a team</option>{teams.map((team) => <option value={team.id} key={team.id}>{team.name}</option>)}</select></label><button className="button" type="submit" disabled={pending}>{pending ? "Sending…" : "Send test email"}</button>{state.error && <p role="alert" style={{ color: "var(--red)" }}>{state.error}</p>}{state.success && <p role="status" style={{ color: "var(--green)" }}>{state.success}</p>}</form>;
}
