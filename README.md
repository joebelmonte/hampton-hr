# Hampton Home Run League

A custom MLB fantasy league where points belong to roster slots—not players. Each team has 14 slots, and its score is the sum of the 12 highest-scoring slots. A player’s home runs count only for the slot they occupied on the date of the event.

## Core design

`HomeRunEvent` and `PlayerAssignment` are the authoritative records. `SlotTotal` is a performance cache that can be deleted and rebuilt. Assignments form a dated timeline: an assignment with no `teamId` or `slotId` means the player is a free agent. Transactions are effective at the start of a day, including retroactive corrections.

## Included scaffold

- Public standings and team-detail routes (currently attractive demo data)
- Commissioner login and replacement form shells
- Prisma/PostgreSQL schema for teams, slots, players, dated assignments, HR events, cached totals, transaction audit records, and daily standings snapshots
- MLB Stats API client and protected five-minute sync route placeholder
- Protected daily-email route placeholder plus Vercel Cron configuration
- Scoring helper that keeps the best 12 of 14 slot totals

## Start locally

1. Install Node 20+ and pnpm.
2. Copy `.env.example` to `.env` and set the Supabase Postgres URL and service credentials.
3. Run `pnpm install`, then `pnpm prisma migrate dev --name init`.
4. Run `pnpm db:seed` to create the initial teams and fourteen roster slots per team. The seed is safe to re-run and does not erase existing data.
5. If this database already has teams from the twelve-slot format, run `pnpm db:upgrade-slots` once to add slots 13 and 14 without changing existing players, transactions, or scoring history.
6. Run `pnpm dev` and visit `http://localhost:3000`.

## Commissioner authentication

Commissioner tools use Supabase email-and-password sign-in. Configure these values in `.env` and in your deployment environment:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-supabase-publishable-key"
COMMISSIONER_EMAILS="you@example.com,co-commissioner@example.com"
```

In Supabase **Authentication → Providers → Email**, enable email/password sign-in. Create each commissioner account in **Authentication → Users → Add user**, using the same email address listed in `COMMISSIONER_EMAILS`; set a password and mark the user as confirmed. Add `http://localhost:3000/auth/update-password` and your production `/auth/update-password` URL to Supabase's allowed redirect URLs. Only exact email addresses in `COMMISSIONER_EMAILS` may access commissioner pages or perform commissioner actions.

## MLB home-run sync and historical backfills

On Vercel, `vercel.json` calls `/api/cron/mlb-sync` daily at 09:00 UTC (5 AM Eastern during daylight time). Each run imports home runs from today and yesterday, then advances one day of the oldest queued historical backfill. Call the protected route manually when you want an additional refresh.

For local development, start the app with `pnpm dev`, export the same `CRON_SECRET` used in `.env`, and call the route yourself:

```bash
export CRON_SECRET="your-value-from-.env"
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/mlb-sync
```

Queue a historical date range from the commissioner portal. Run the `curl` command again for each date in that range; the response includes the backfill date and status, and reports `COMPLETE` when the range is finished.

## Daily standings email

`/api/cron/daily-email` sends each captain a personalized standings summary. Configure a Resend API key and a verified sender:

```bash
RESEND_API_KEY="re_..."
EMAIL_FROM="Hampton HR League <league@your-verified-domain.com>"
```

Delivery records prevent the same team from receiving more than one scheduled summary for a given day. After pulling these changes, run `pnpm prisma migrate dev` locally (or `pnpm prisma migrate deploy` in production) to create the delivery-record table.

## Moving a league between environments

Use the **Transfer league setup** section in the commissioner portal to download a JSON export from development. In production, choose that same file and confirm **Import into empty league**.

The bundle includes team names, captain emails, slugs, slot numbers, transaction records, and the dated roster-assignment timeline required to score historical home runs correctly. New exports preserve full transaction timestamps, including multiple moves by the same player on one day; older date-only exports remain supported. Import validates the complete bundle and only runs when the destination has no teams, preventing an accidental merge with a mismatched league. Player records and imported MLB home-run events are preserved.

## Importing the 2026 league CSV export

Put `Current-Rosters.csv` and `Transaction-history.csv` in `2026-league-import/`. First validate the files without changing the database:

```bash
pnpm db:import-2026-league
```

Then import into an empty database:

```bash
pnpm db:import-2026-league -- --apply
```

To intentionally replace every existing team, roster assignment, and transaction in a database, add the separate destructive confirmation flag:

```bash
pnpm db:import-2026-league -- --apply --replace-existing
```

The replacement mode preserves MLB player records and home-run event data, but permanently removes existing teams, their slots, transactions, and roster-assignment history. The importer reconstructs a stable slot timeline from the current rosters and paired claim/drop history. It defaults initial, non-transaction players to `2026-03-26`; set `IMPORT_SEASON_START` before running if your league began on a different date. Captain emails are not included in the CSV files, so each imported team receives a safe placeholder email; update those in **Commissioner → League setup** before enabling captain emails. The standard importer refuses to run if the database already contains teams.

## Implementation order

1. Implement the commissioner-only Supabase Auth gate.
2. Create a transaction service that writes the incoming player assignment, writes the outgoing player’s free-agent assignment, creates `RosterTransaction`, then rebuilds affected totals.
3. Finish the MLB job: fetch today’s active/completed games, compare boxscores to stored events, insert idempotent `HomeRunEvent` rows, and refresh `SlotTotal`.
4. Build the Resend summary email from the same standings service used by the public page.
5. Add tests for retroactive moves, free agents, duplicate sync runs, and the “top 12 slots” rule.

## Scheduling

`vercel.json` invokes MLB sync at 09:00 UTC and sends email at 11:00 UTC (5 AM and 7 AM Eastern during daylight time). Vercel cron schedules use UTC; during Eastern Standard Time these run one hour earlier locally. For baseball-season use, this aligns with the requested morning schedule; use a timezone-aware scheduler if precise year-round local-time delivery is essential.

## Data integrity rules

- A player has at most one assignment starting on a given date.
- An assignment in effect on a game day is the player’s most recent assignment with `effectiveDate <= gameDate`.
- Free agents accrue no fantasy points.
- Never manually alter accumulated slot points; rebuild from events and assignment history.
