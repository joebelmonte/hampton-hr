import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function commissionerEmails() {
  const emails = (process.env.COMMISSIONER_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  if (!emails.length) throw new Error("COMMISSIONER_EMAILS must list at least one authorized commissioner email address.");
  return emails;
}

export async function getCommissionerUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) return null;
  return commissionerEmails().includes(user.email.toLowerCase()) ? user : null;
}

export async function requireCommissioner(next = "/commissioner/transactions") {
  const user = await getCommissionerUser();
  if (!user) redirect(`/commissioner/login?next=${encodeURIComponent(next)}`);
  return user;
}
