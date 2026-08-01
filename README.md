# Hampton Home Run League

A custom MLB fantasy league where points belong to roster slots—not players. Each team has 12 slots, and its score is the sum of the 10 highest-scoring slots. A player’s home runs count only for the slot they occupied on the date of the event.

## Core design

`HomeRunEvent` and `PlayerAssignment` are the authoritative records. `SlotTotal` is a performance cache that can be deleted and rebuilt. Assignments form a dated timeline: an assignment with no `teamId` or `slotId` means the player is a free agent. Transactions are effective at the start of a day, including retroactive corrections.

## Included scaffold

- Public standings and team-detail routes (currently attractive demo data)
- Commissioner login and replacement form shells
- Prisma/PostgreSQL schema for teams, slots, players, dated assignments, HR events, cached totals, transaction audit records, and daily standings snapshots
- MLB Stats API client and protected five-minute sync route placeholder
- Protected daily-email route placeholder plus Vercel Cron configuration
- Scoring helper that keeps the best 10 of 12 slot totals

## Start locally

1. Install Node 20+ and pnpm.
2. Copy `.env.example` to `.env` and set the Supabase Postgres URL and service credentials.
3. Run `pnpm install`, then `pnpm prisma migrate dev --name init`.
4. Run `pnpm dev` and visit `http://localhost:3000`.

## Implementation order

1. Add a Prisma client and replace `src/lib/demo-data.ts` reads with standings queries.
2. Implement the commissioner-only Supabase Auth gate.
3. Create a transaction service that writes the incoming player assignment, writes the outgoing player’s free-agent assignment, creates `RosterTransaction`, then rebuilds affected totals.
4. Finish the MLB job: fetch today’s active/completed games, compare boxscores to stored events, insert idempotent `HomeRunEvent` rows, and refresh `SlotTotal`.
5. Build the Resend summary email from the same standings service used by the public page.
6. Add tests for retroactive moves, free agents, duplicate sync runs, and the “top 10 slots” rule.

## Scheduling

`vercel.json` invokes MLB sync every five minutes. The completed job should exit quickly when no games are live or recently finished. It schedules email for 10:00 UTC (roughly 6 AM Eastern during daylight time); adjust it for daylight-saving behavior or use a timezone-aware scheduler if precise local-time delivery is essential.

## Data integrity rules

- A player has at most one assignment starting on a given date.
- An assignment in effect on a game day is the player’s most recent assignment with `effectiveDate <= gameDate`.
- Free agents accrue no fantasy points.
- Never manually alter accumulated slot points; rebuild from events and assignment history.
