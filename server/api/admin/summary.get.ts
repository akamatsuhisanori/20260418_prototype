// ============================================================
// /api/admin/summary
//   管理ダッシュボード用の集計値
// ============================================================
import { getSupabaseAdmin, requireAdmin } from "~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const admin = getSupabaseAdmin();

  const [{ count: totalInvitations }, { count: pendingInvitations }, { count: acceptedInvitations }] =
    await Promise.all([
      admin.from("invitations").select("*", { count: "exact", head: true }),
      admin
        .from("invitations")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      admin
        .from("invitations")
        .select("*", { count: "exact", head: true })
        .eq("status", "accepted"),
    ]);

  const [{ count: totalResponses }, { count: submittedResponses }] = await Promise.all([
    admin.from("responses").select("*", { count: "exact", head: true }),
    admin
      .from("responses")
      .select("*", { count: "exact", head: true })
      .eq("is_submitted", true),
  ]);

  return {
    totalInvitations: totalInvitations ?? 0,
    pendingInvitations: pendingInvitations ?? 0,
    acceptedInvitations: acceptedInvitations ?? 0,
    totalResponses: totalResponses ?? 0,
    submittedResponses: submittedResponses ?? 0,
  };
});
