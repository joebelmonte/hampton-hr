"use client";

import { useActionState } from "react";
import { createTeam, deleteTeam, type TransactionFormState, updateTeam } from "../transactions/actions";

const initialState: TransactionFormState = {};
type Team = { id: string; name: string; slug: string; ownerEmail: string; slots: { id: string; number: number; cachedTotal: { totalHomeRuns: number } | null; _count: { assignments: number } }[]; _count: { assignments: number; transactions: number; standings: number } };

function Status({ state }: { state: TransactionFormState }) {
  return <>{state.error && <p role="alert" style={{ color: "var(--red)" }}>{state.error}</p>}{state.success && <p role="status" style={{ color: "var(--green)" }}>{state.success}</p>}</>;
}

export function TeamManager({ teams }: { teams: Team[] }) {
  const [createState, createAction, creating] = useActionState(createTeam, initialState);
  return <div className="league-manager"><form action={createAction} className="team-create"><label>Team name<input name="name" required placeholder="e.g. Moonshots" /></label><label>Captain email<input name="ownerEmail" type="email" required placeholder="captain@example.com" /></label><button className="button" type="submit" disabled={creating}>{creating ? "Creating…" : "Add team"}</button><Status state={createState} /></form><div className="team-list">{teams.map((team) => <TeamCard key={team.id} team={team} />)}</div></div>;
}

function TeamCard({ team }: { team: Team }) {
  const [updateState, updateAction, updating] = useActionState(updateTeam, initialState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteTeam, initialState);
  const locked = Boolean(team._count.assignments || team._count.transactions || team._count.standings || team.slots.some((slot) => slot._count.assignments || (slot.cachedTotal?.totalHomeRuns ?? 0) > 0));
  return <article className="team-admin-card"><form action={updateAction} className="team-edit"><input type="hidden" name="teamId" value={team.id} /><label>Team name<input name="name" defaultValue={team.name} required /></label><label>Captain email<input name="ownerEmail" type="email" defaultValue={team.ownerEmail} required /></label><p className="updated">URL: /teams/{team.slug} · {team.slots.length} slots</p><button className="button" type="submit" disabled={updating}>{updating ? "Saving…" : "Save changes"}</button><Status state={updateState} /></form><form action={deleteAction} onSubmit={(event) => { if (!window.confirm(`Delete ${team.name} and its 12 empty roster slots?`)) event.preventDefault(); }}><input type="hidden" name="teamId" value={team.id} /><button className="button button-danger" type="submit" disabled={locked || deleting}>{locked ? "Has league history" : deleting ? "Deleting…" : "Delete team"}</button><Status state={deleteState} /></form></article>;
}
