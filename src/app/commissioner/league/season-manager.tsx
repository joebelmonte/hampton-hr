"use client";

import { useActionState } from "react";
import { completeSeason, createSeason, type TransactionFormState } from "../transactions/actions";

const initialState: TransactionFormState = {};

function Status({ state }: { state: TransactionFormState }) {
  return <>{state.error && <p role="alert" style={{ color: "var(--red)" }}>{state.error}</p>}{state.success && <p role="status" style={{ color: "var(--green)" }}>{state.success}</p>}</>;
}

export function SeasonManager({ activeSeason }: { activeSeason: { year: number; startDate: Date } | null }) {
  const [completeState, completeAction, completing] = useActionState(completeSeason, initialState);
  const [createState, createAction, creating] = useActionState(createSeason, initialState);
  const today = new Date().toISOString().slice(0, 10);
  if (!activeSeason) return <div className="season-manager"><p className="updated">There is no active season. Archived teams and transactions remain read-only.</p><form action={createAction} className="team-create"><label>Season year<input name="year" type="number" min="2000" max="2100" required defaultValue={new Date().getFullYear()} /></label><label>Season start date<input name="startDate" type="date" required /></label><button className="button" type="submit" disabled={creating}>{creating ? "Starting…" : "Start season"}</button><Status state={createState} /></form></div>;
  return <div className="season-manager"><p className="updated">{activeSeason.year} is active. Completing it freezes public standings and team pages, and stops scheduled captain emails.</p><form action={completeAction} className="team-create" onSubmit={(event) => { if (!window.confirm(`Complete the ${activeSeason.year} season? Teams and transactions will become read-only.`)) event.preventDefault(); }}><label>Final scoring date<input name="endDate" type="date" min={activeSeason.startDate.toISOString().slice(0, 10)} defaultValue={today} required /></label><button className="button button-danger" type="submit" disabled={completing}>{completing ? "Completing…" : `Complete ${activeSeason.year} season`}</button><Status state={completeState} /></form></div>;
}
