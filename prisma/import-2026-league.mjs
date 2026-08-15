import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const importDirectory = path.resolve("2026-league-import");
const rosterPath = path.join(importDirectory, "Current-Rosters.csv");
const transactionPath = path.join(importDirectory, "Transaction-history.csv");
const teamAliases = new Map([["Pete/Bill", "Pete/Bil"], ["Robert Killen", "Bob K."]]);
const seasonStart = process.env.IMPORT_SEASON_START ?? "2026-03-26";
const apply = process.argv.includes("--apply");
const replaceExisting = process.argv.includes("--replace-existing");

function parseCsv(filePath) {
  const source = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "").trim();
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') { field += '"'; index += 1; } else quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field); field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += character;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function slugify(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function canonicalTeam(name) { return teamAliases.get(name) ?? name; }

function parseEdt(value) {
  const match = value.match(/^\w{3} (\w{3}) (\d{1,2}), (\d{4}), (\d{1,2}):(\d{2})(AM|PM)$/);
  if (!match) throw new Error(`Unable to parse transaction date: ${value}`);
  const [, monthName, day, year, rawHour, minute, meridiem] = match;
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(monthName);
  if (month < 0) throw new Error(`Unable to parse transaction month: ${value}`);
  let hour = Number(rawHour) % 12;
  if (meridiem === "PM") hour += 12;
  return new Date(Date.UTC(Number(year), month, Number(day), hour + 4, Number(minute)));
}

function playerKey(player) { return String(player.mlbPlayerId); }

const rosterRows = parseCsv(rosterPath).slice(1);
const transactionRows = parseCsv(transactionPath).slice(1);
const teams = new Map();
const players = new Map();

for (const row of rosterRows) {
  const [, fullName, , , , rawTeam, rawMlbPlayerId] = row;
  const team = canonicalTeam(rawTeam);
  const mlbPlayerId = Number(rawMlbPlayerId);
  if (!team || !fullName || !Number.isInteger(mlbPlayerId)) throw new Error("Current-Rosters.csv contains an incomplete row.");
  const roster = teams.get(team) ?? [];
  roster.push({ fullName, mlbPlayerId });
  teams.set(team, roster);
  players.set(String(mlbPlayerId), { fullName, mlbPlayerId });
}

for (const [team, roster] of teams) {
  if (roster.length !== 14) throw new Error(`${team} has ${roster.length} current players; expected 14.`);
}

const groupedTransactions = new Map();
for (const row of transactionRows) {
  const [fullName, , , type, rawTeam, rawDate, , rawMlbPlayerId] = row;
  const team = canonicalTeam(rawTeam);
  const mlbPlayerId = Number(rawMlbPlayerId);
  if (!fullName || !["Claim", "Drop"].includes(type) || !team || !Number.isInteger(mlbPlayerId)) throw new Error("Transaction-history.csv contains an incomplete row.");
  const timestamp = parseEdt(rawDate);
  const key = `${team}|${timestamp.toISOString()}`;
  const group = groupedTransactions.get(key) ?? { team, timestamp, claim: null, drop: null };
  if (group[type.toLowerCase()]) throw new Error(`More than one ${type.toLowerCase()} for ${team} at ${rawDate}.`);
  group[type.toLowerCase()] = { fullName, mlbPlayerId };
  groupedTransactions.set(key, group);
  players.set(String(mlbPlayerId), { fullName, mlbPlayerId });
}

const transactions = [...groupedTransactions.values()].sort((left, right) => left.timestamp - right.timestamp);
for (const transaction of transactions) {
  if (!transaction.claim || !transaction.drop) throw new Error(`${transaction.team} has an unpaired transaction at ${transaction.timestamp.toISOString()}.`);
}

function cloneSlots(source) { return new Map([...source].map(([team, slots]) => [team, new Map(slots)])); }
function findPlayer(slotsByTeam, playerId) {
  for (const [team, slots] of slotsByTeam) for (const [slot, value] of slots) if (value === playerId) return { team, slot };
  return null;
}

const finalSlots = new Map([...teams].map(([team, roster]) => [team, new Map(roster.map((player, index) => [index + 1, playerKey(player)]))]));
const initialSlots = cloneSlots(finalSlots);
for (const transaction of [...transactions].reverse()) {
  const incoming = playerKey(transaction.claim);
  const outgoing = playerKey(transaction.drop);
  const incomingLocation = findPlayer(initialSlots, incoming);
  if (!incomingLocation || incomingLocation.team !== transaction.team) throw new Error(`Cannot reverse claim of ${transaction.claim.fullName} for ${transaction.team}.`);
  if (findPlayer(initialSlots, outgoing)) throw new Error(`${transaction.drop.fullName} is already rostered when reversing ${transaction.timestamp.toISOString()}.`);
  initialSlots.get(transaction.team).set(incomingLocation.slot, outgoing);
}

const replayedSlots = cloneSlots(initialSlots);
for (const transaction of transactions) {
  const outgoing = playerKey(transaction.drop);
  const incoming = playerKey(transaction.claim);
  const outgoingLocation = findPlayer(replayedSlots, outgoing);
  if (!outgoingLocation || outgoingLocation.team !== transaction.team) throw new Error(`Cannot apply drop of ${transaction.drop.fullName} for ${transaction.team}.`);
  if (findPlayer(replayedSlots, incoming)) throw new Error(`${transaction.claim.fullName} is already rostered when applying ${transaction.timestamp.toISOString()}.`);
  transaction.slotNumber = outgoingLocation.slot;
  replayedSlots.get(transaction.team).set(outgoingLocation.slot, incoming);
}
for (const [team, slots] of finalSlots) for (const [slot, playerId] of slots) {
  if (replayedSlots.get(team).get(slot) !== playerId) throw new Error(`Replayed roster does not match ${team}'s current roster.`);
}

console.log(`Validated ${teams.size} teams, ${players.size} players, and ${transactions.length} paired transactions.`);
console.log(`Initial assignments use ${seasonStart}; transaction times are preserved from the EDT export.`);
console.log("Imported captain emails will be placeholders and must be updated in Commissioner → League setup.");

if (!apply) {
  console.log("Dry run only. Re-run with: pnpm db:import-2026-league -- --apply");
  console.log("To replace an existing league, use: pnpm db:import-2026-league -- --apply --replace-existing");
  process.exit(0);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL must be set before importing the league.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const teamCount = await prisma.team.count();
  if (teamCount && !replaceExisting) throw new Error(`Import stopped: this database already has ${teamCount} team${teamCount === 1 ? "" : "s"}. Import only runs into an empty league. To intentionally replace it, add --replace-existing.`);
  await prisma.$transaction(async (tx) => {
    if (teamCount && replaceExisting) {
      await tx.rosterTransaction.deleteMany();
      await tx.playerAssignment.deleteMany();
      await tx.team.deleteMany();
    }
    const databaseTeams = new Map();
    for (const [name] of teams) {
      const team = await tx.team.create({ data: {
        name,
        slug: slugify(name),
        ownerEmail: `unassigned+${slugify(name)}@example.invalid`,
        slots: { create: Array.from({ length: 14 }, (_, index) => ({ number: index + 1 })) },
      }, include: { slots: true } });
      databaseTeams.set(name, { id: team.id, slots: new Map(team.slots.map((slot) => [slot.number, slot.id])) });
    }

    const databasePlayers = new Map();
    for (const player of players.values()) {
      const databasePlayer = await tx.player.upsert({
        where: { mlbPlayerId: player.mlbPlayerId },
        create: player,
        update: { fullName: player.fullName, active: true },
      });
      databasePlayers.set(playerKey(player), databasePlayer.id);
    }

    for (const [teamName, slots] of initialSlots) for (const [slotNumber, playerId] of slots) {
      const team = databaseTeams.get(teamName);
      await tx.playerAssignment.create({ data: {
        playerId: databasePlayers.get(playerId), teamId: team.id, slotId: team.slots.get(slotNumber), effectiveDate: new Date(`${seasonStart}T00:00:00.000Z`),
      } });
    }

    for (const transaction of transactions) {
      const team = databaseTeams.get(transaction.team);
      const outgoingId = databasePlayers.get(playerKey(transaction.drop));
      const incomingId = databasePlayers.get(playerKey(transaction.claim));
      const slotId = team.slots.get(transaction.slotNumber);
      await tx.playerAssignment.create({ data: { playerId: outgoingId, effectiveDate: transaction.timestamp } });
      await tx.playerAssignment.create({ data: { playerId: incomingId, teamId: team.id, slotId, effectiveDate: transaction.timestamp } });
      await tx.rosterTransaction.create({ data: {
        teamId: team.id, slotId, playerOutId: outgoingId, playerInId: incomingId, effectiveDate: transaction.timestamp,
        notes: "Imported from 2026-league-import transaction history.",
      } });
    }
  }, { timeout: 30_000 });
  console.log(`${teamCount && replaceExisting ? "Replaced the existing league and imported" : "Imported"} the 2026 league successfully.`);
}

main().finally(() => prisma.$disconnect());
