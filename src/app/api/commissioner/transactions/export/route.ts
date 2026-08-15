import { exportTransactionBundle } from "@/lib/transaction-transfer";
import { getCommissionerUser } from "@/lib/commissioner-auth";

export async function GET() {
  if (!await getCommissionerUser()) return new Response("Unauthorized", { status: 401 });
  const bundle = await exportTransactionBundle();
  const filename = `hampton-league-${bundle.exportedAt.slice(0, 10)}.json`;
  return new Response(JSON.stringify(bundle, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="${filename}"` } });
}
