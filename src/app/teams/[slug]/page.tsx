import Link from "next/link";
import { Fragment } from "react";
import { DEMO_SLOTS, DEMO_STANDINGS } from "@/lib/demo-data";

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const team = DEMO_STANDINGS.find((candidate) => candidate.slug === slug) ?? DEMO_STANDINGS[0];
  const slots = [...DEMO_SLOTS].sort((a, b) => b.total - a.total);
  return <main className="shell"><Link className="updated" href="/">← All standings</Link><section className="hero"><p className="eyebrow">Team detail</p><h1>{team.name}</h1><p className="lede">{team.total} points · top 10 slots count</p></section><section className="card"><div className="detail-grid"><div className="detail-head">Slot</div><div className="detail-head">Player history</div><div className="detail-head">Points</div>{slots.map((slot, i) => { const className = i >= slots.length - 2 ? "bench" : ""; return <Fragment key={slot.number}><div className={className}>#{slot.number}</div><div className={`history ${className}`}>{slot.players.map((player) => <span key={player.name} className={player.current ? "current" : "past"}>{player.name} ({player.points})</span>)}</div><div className={`total ${className}`}>{slot.total}</div></Fragment>; })}<div className="total-row">Total</div><div className="total-row">Best 10 slots</div><div className="total-row">{team.total}</div></div></section><section className="card" style={{marginTop: 28}}><div className="card-heading"><h2>Transactions</h2></div><div style={{padding: 24}}><strong>July 15</strong><p className="updated">Slot #4 · OUT Aaron Judge · IN Pete Alonso</p></div></section></main>;
}
