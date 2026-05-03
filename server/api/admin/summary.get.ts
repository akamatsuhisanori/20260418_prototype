// ============================================================
// /api/admin/summary
//   管理ダッシュボード用の集計値（トークン発行ベース）
// ============================================================
import { getSupabaseAdmin, requireAdmin } from "~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const admin = getSupabaseAdmin();

  const [
    { count: totalRespondents },
    { count: submittedResponses },
    { count: revokedRespondents },
  ] = await Promise.all([
    admin.from("responses").select("*", { count: "exact", head: true }),
    admin
      .from("responses")
      .select("*", { count: "exact", head: true })
      .eq("is_submitted", true),
    admin
      .from("responses")
      .select("*", { count: "exact", head: true })
      .eq("is_revoked", true),
  ]);

  // 回答中 = 失効でも提出済でもなく、updated_at が動いた行
  const { count: startedRespondents } = await admin
    .from("responses")
    .select("*", { count: "exact", head: true })
    .eq("is_submitted", false)
    .eq("is_revoked", false);

  return {
    totalRespondents: totalRespondents ?? 0,
    inProgressRespondents: startedRespondents ?? 0,
    submittedResponses: submittedResponses ?? 0,
    revokedRespondents: revokedRespondents ?? 0,
  };
});
