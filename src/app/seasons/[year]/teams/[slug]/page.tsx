import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { getSeasonByYear } from "@/lib/seasons";
import { getTeamDetailForSeason } from "@/lib/standings";

export const dynamic = "force-dynamic";

const dateLabel = (date: Date) => date.toLocaleDateString("en-US", { month: "numeric", day: "numeric", timeZone: "UTC" });

export default async function ArchivedTeamPage({ params }: { params: Promise<{ year: string; slug: string }> }) {
  const { year: rawYear, slug } = await params;
  const season = await getSeasonByYear(Number(rawYear));
  if (!season || season.status !== "COMPLETED") notFound();
  const team = await getTeamDetailForSeason(season, slug);
  if (!team) notFound();
  return <main className="shell"><Link className="updated" href={`/seasons/${season.year}`}>← {season.year} final standings</Link><section className="hero"><p className="eyebrow">Archived team detail</p><h1>{team.name}</h1><p className="lede">{team.total} final points · top 12 slots count</p></section><section className="card"><div className="detail-grid"><div className="detail-head">Slot</div><div className="detail-head">Player history</div><div className="detail-head">Points</div>{team.slots.map((slot, i) => { const className = i >= team.slots.length - 2 ? "bench" : ""; return <Fragment key={slot.number}><div className={className}>#{slot.number}</div><div className={`history ${className}`}>{slot.players.length ? slot.players.map((player) => <span key={player.id} className={player.current ? "current" : "past"}>{player.name} ({dateLabel(player.startDate)}-{player.endDate ? dateLabel(player.endDate) : "final"}): {player.homeRuns}</span>) : <span className="muted">Unassigned</span>}</div><div className={`total ${className}`}>{slot.total}</div></Fragment>; })}<div className="total-row">Total</div><div className="total-row">Best 12 slots</div><div className="total-row">{team.total}</div></div></section><section className="card" style={{ marginTop: 28 }}><div className="card-heading"><h2>Transactions</h2></div><div style={{ padding: 24 }}>{team.transactions.length ? team.transactions.map((transaction) => <div key={transaction.id}><strong>{transaction.effectiveDate.toLocaleDateString()}</strong><p className="updated">Slot #{transaction.slot.number} · OUT {transaction.playerOut?.fullName ?? "Free agent"} · IN {transaction.playerIn.fullName}</p></div>) : <p className="updated">No transactions yet.</p>}</div></section></main>;
}
