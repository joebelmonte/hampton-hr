"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Standing } from "@/lib/standings";

type SortKey = "total" | "today" | "yesterday" | "pastSevenDays" | "pastThirtyDays";
const columns: { key: SortKey; label: string }[] = [
  { key: "total", label: "Total" },
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "pastSevenDays", label: "Past 7 days" },
  { key: "pastThirtyDays", label: "Past 30 days" },
];

export function StandingsTable({ standings }: { standings: Standing[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const rows = useMemo(() => [...standings].sort((a, b) => b[sortKey] - a[sortKey] || a.rank - b.rank || a.name.localeCompare(b.name)), [sortKey, standings]);
  const high = Object.fromEntries(columns.map(({ key }) => [key, Math.max(...standings.map((team) => team[key]), 0)])) as Record<SortKey, number>;
  const low = Object.fromEntries(columns.map(({ key }) => [key, Math.min(...standings.map((team) => team[key]), 0)])) as Record<SortKey, number>;
  return <div className="table-wrap"><table><thead><tr><th>Rank</th><th>Team</th>{columns.map((column) => <th key={column.key}><button className="sort-header" type="button" onClick={() => setSortKey(column.key)}>{column.label}{sortKey === column.key ? " ↓" : ""}</button></th>)}</tr></thead><tbody>{rows.map((team) => <tr key={team.slug}><td>{team.rank}</td><td><Link className="team-link" href={`/teams/${team.slug}`}>{team.name}</Link></td>{columns.map((column) => <td key={column.key} className={`${column.key === "total" ? "total " : ""}${team[column.key] === high[column.key] ? "best" : team[column.key] === low[column.key] ? "worst" : ""}`}>{team[column.key]}</td>)}</tr>)}</tbody></table></div>;
}
