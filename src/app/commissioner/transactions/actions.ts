"use server";

import { revalidatePath } from "next/cache";
import { mlbPlayer } from "@/lib/mlb";
import { queueMlbBackfill } from "@/lib/mlb-sync";
import { deleteRosterTransaction, replacePlayer } from "@/lib/roster";
import { importTransactionBundle } from "@/lib/transaction-transfer";
import { requireCommissioner } from "@/lib/commissioner-auth";
import { createLeagueTeam, deleteLeagueTeam, updateLeagueTeam } from "@/lib/league-admin";
import { sendTestStandingsEmail } from "@/lib/daily-email";

export type TransactionFormState = { error?: string; success?: string };

export async function saveTransaction(_: TransactionFormState, formData: FormData): Promise<TransactionFormState> {
  try {
    await requireCommissioner();
    const mlbPlayerId = Number(formData.get("mlbPlayerId"));
    const player = await mlbPlayer(mlbPlayerId);
    const result = await replacePlayer({
      slotId: String(formData.get("slotId") ?? ""),
      mlbPlayerId: player.id,
      fullName: player.fullName,
      active: player.active,
      effectiveDate: String(formData.get("effectiveDate") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    });
    revalidatePath("/");
    revalidatePath(`/teams/${result.teamSlug}`);
    revalidatePath("/commissioner/transactions");
    return { success: `${player.fullName} added. The roster timeline and standings have been refreshed.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to save the transaction." };
  }
}

export async function deleteTransaction(formData: FormData) {
  await requireCommissioner();
  const transactionId = String(formData.get("transactionId") ?? "");
  if (!transactionId) throw new Error("Missing transaction ID.");
  const result = await deleteRosterTransaction(transactionId);
  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath(`/teams/${result.teamSlug}`);
  revalidatePath("/commissioner/transactions");
}

export async function createBackfill(_: TransactionFormState, formData: FormData): Promise<TransactionFormState> {
  try {
    await requireCommissioner();
    await queueMlbBackfill(String(formData.get("startDate") ?? ""), String(formData.get("endDate") ?? ""));
    revalidatePath("/commissioner/transactions");
    return { success: "Historical backfill queued. The cron job will import one day every five minutes." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to queue the backfill." };
  }
}

export async function importTransactions(_: TransactionFormState, formData: FormData): Promise<TransactionFormState> {
  try {
    await requireCommissioner();
    const file = formData.get("transactionBundle");
    if (!(file instanceof File) || !file.size) throw new Error("Choose an exported transaction JSON file.");
    const result = await importTransactionBundle(await file.text());
    revalidatePath("/");
    revalidatePath("/transactions");
    revalidatePath("/commissioner/transactions");
    revalidatePath("/teams", "layout");
    return { success: `Imported the league with ${result.transactions} transactions and ${result.assignments} assignment records.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to import transactions." };
  }
}

function refreshLeagueSetup() {
  revalidatePath("/");
  revalidatePath("/commissioner/league");
  revalidatePath("/commissioner/transactions");
}

export async function createTeam(_: TransactionFormState, formData: FormData): Promise<TransactionFormState> {
  try {
    await requireCommissioner("/commissioner/league");
    const team = await createLeagueTeam({ name: String(formData.get("name") ?? ""), ownerEmail: String(formData.get("ownerEmail") ?? "") });
    refreshLeagueSetup();
    return { success: `${team.name} created with 12 roster slots.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to create team." };
  }
}

export async function updateTeam(_: TransactionFormState, formData: FormData): Promise<TransactionFormState> {
  try {
    await requireCommissioner("/commissioner/league");
    const team = await updateLeagueTeam({ id: String(formData.get("teamId") ?? ""), name: String(formData.get("name") ?? ""), ownerEmail: String(formData.get("ownerEmail") ?? "") });
    refreshLeagueSetup();
    return { success: `${team.name} updated.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update team." };
  }
}

export async function deleteTeam(_: TransactionFormState, formData: FormData): Promise<TransactionFormState> {
  try {
    await requireCommissioner("/commissioner/league");
    await deleteLeagueTeam(String(formData.get("teamId") ?? ""));
    refreshLeagueSetup();
    return { success: "Team deleted." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to delete team." };
  }
}

export async function sendTestEmail(_: TransactionFormState, formData: FormData): Promise<TransactionFormState> {
  try {
    const user = await requireCommissioner();
    if (!user.email) throw new Error("Your commissioner account has no email address.");
    await sendTestStandingsEmail(user.email, String(formData.get("teamId") ?? ""));
    return { success: `Test email sent to ${user.email}.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to send test email." };
  }
}
