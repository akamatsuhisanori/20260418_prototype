// ============================================================
// GET /api/respondent/[token]
//   トークンを知っている人だけが回答行を読める。
//   - 該当行が無い / is_revoked → 404
//   - 提出済の場合は is_submitted=true と data を返す（閲覧のみ）
// ============================================================
import { getSupabaseAdmin } from "~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, "token");
  if (!token || token.length < 16) {
    throw createError({ statusCode: 400, statusMessage: "invalid token" });
  }
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("responses")
    .select("data, is_submitted, is_revoked, label, started_at, updated_at, submitted_at")
    .eq("access_token", token)
    .maybeSingle();

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }
  if (!data || data.is_revoked) {
    throw createError({ statusCode: 404, statusMessage: "not found" });
  }
  return {
    data: data.data,
    is_submitted: data.is_submitted,
    label: data.label,
    started_at: data.started_at,
    updated_at: data.updated_at,
    submitted_at: data.submitted_at,
  };
});
