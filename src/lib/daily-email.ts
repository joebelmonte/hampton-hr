import { Resend } from "resend";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStandings, type Standing } from "@/lib/standings";

const startOfDay = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);

export function renderDailyStandingsEmail(teamName: string, standings: Standing[], asOf: Date) {
  const rows = standings.map((team) => `<tr${team.name === teamName ? ' style="background:#f3eee4"' : ""}><td style="padding:8px;border-bottom:1px solid #e6dfd4;text-align:center">${team.rank}</td><td style="padding:8px;border-bottom:1px solid #e6dfd4;text-align:center"><strong>${escapeHtml(team.name)}</strong></td><td style="padding:8px;border-bottom:1px solid #e6dfd4;text-align:center">${team.total}</td><td style="padding:8px;border-bottom:1px solid #e6dfd4;text-align:center">${team.yesterday}</td><td style="padding:8px;border-bottom:1px solid #e6dfd4;text-align:center">${team.pastSevenDays}</td></tr>`).join("");
  const date = asOf.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f2e9;color:#172126;font-family:Arial,Helvetica,sans-serif"><main style="max-width:640px;margin:auto;background:#fffdf8;border:1px solid #ded7c9;border-radius:12px;overflow:hidden"><header style="padding:24px;border-left:6px solid #e7aa2c"><p style="margin:0 0 8px;color:#756d60;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase">Hampton Home Run League</p><h1 style="margin:0;font-family:Georgia,serif;font-size:30px">Daily standings</h1><p style="margin:10px 0 0">${date}</p></header><section style="padding:0 24px 24px"><p>Your team, <strong>${escapeHtml(teamName)}</strong>, is highlighted below.</p><table style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr style="color:#756d60;text-align:center"><th style="padding:8px">Rank</th><th style="padding:8px">Team</th><th style="padding:8px">Total</th><th style="padding:8px">Yesterday</th><th style="padding:8px">Past 7 Days</th></tr></thead><tbody>${rows}</tbody></table><p style="color:#756d60;font-size:12px">Totals include each team’s twelve highest-scoring slots.</p></section></main></body></html>`;
}

export async function sendDailyStandingsEmails(asOf = new Date()) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("RESEND_API_KEY and EMAIL_FROM must be configured before sending daily email.");
  const day = startOfDay(asOf);
  const [standings, teams] = await Promise.all([getStandings(day), prisma.team.findMany({ select: { id: true, name: true, ownerEmail: true } })]);
  const resend = new Resend(apiKey);
  let sent = 0;
  let skipped = 0;
  const failures: string[] = [];
  for (const team of teams) {
    try {
      await prisma.dailyEmailDelivery.create({ data: { teamId: team.id, asOfDate: day } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") { skipped++; continue; }
      throw error;
    }
    const { error } = await resend.emails.send({ from, to: team.ownerEmail, subject: `Hampton HR standings — ${day.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`, html: renderDailyStandingsEmail(team.name, standings, day) });
    if (error) {
      await prisma.dailyEmailDelivery.delete({ where: { teamId_asOfDate: { teamId: team.id, asOfDate: day } } });
      failures.push(`${team.ownerEmail}: ${error.message}`);
    } else sent++;
  }
  return { sent, skipped, failures };
}

export async function sendTestStandingsEmail(recipient: string, teamId: string, asOf = new Date()) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("RESEND_API_KEY and EMAIL_FROM must be configured before sending test email.");
  const [team, standings] = await Promise.all([prisma.team.findUnique({ where: { id: teamId }, select: { name: true } }), getStandings(asOf)]);
  if (!team) throw new Error("Select a team to highlight in the test email.");
  const { error } = await new Resend(apiKey).emails.send({
    from,
    to: recipient,
    subject: "[TEST] Hampton HR standings",
    html: renderDailyStandingsEmail(team.name, standings, startOfDay(asOf)),
  });
  if (error) throw new Error(error.message);
}
